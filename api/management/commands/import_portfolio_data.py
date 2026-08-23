import json
from pathlib import Path
from datetime import datetime

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.models import (
    SiteProfile,
    Experience,
    Project,
    SkillCategory,
    Skill,
    Certificate,
)


class Command(BaseCommand):
    help = "Import portfolio data from data.json into database"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            default="data.json",
            help="Path to JSON file (default: data.json)",
        )
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Hard reset imported tables before import",
        )

    def handle(self, *args, **options):
        file_path = options["file"]
        flush = options["flush"]

        json_path = Path(file_path)
        if not json_path.is_absolute():
            json_path = Path(settings.BASE_DIR) / json_path

        if not json_path.exists():
            raise CommandError(f"File not found: {json_path}")

        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            raise CommandError(f"Could not read JSON file: {e}")

        with transaction.atomic():
            if flush:
                self._flush_data()

            self._import_site_profile(data)
            self._import_experiences(data.get("experiences", []))
            self._import_projects(data.get("projects", []))
            self._import_skills(data.get("skills", {}))
            self._import_certificates(data.get("certifications", []))

        self.stdout.write(self.style.SUCCESS("Portfolio data imported successfully."))

    def _flush_data(self):
        # با توجه به اینکه کلید خارجی وجود دارد، ترتیب حذف مهم است
        Skill.objects.all().delete()
        SkillCategory.objects.all().delete()
        Experience.objects.all().delete()
        Project.objects.all().delete()
        Certificate.objects.all().delete()
        SiteProfile.objects.all().delete()
        self.stdout.write(self.style.WARNING("Existing data deleted (flushed)."))

    def _import_site_profile(self, data):
        basics = data.get("basics", {})
        profiles = basics.get("profiles", [])

        socials = {
            "website": "",
            "telegram": "",
            "github": "",
            "linkedin": "",
            "instagram": "",
        }

        for item in profiles:
            network = (item.get("network") or "").strip().lower()
            url = (item.get("url") or "").strip()
            if network in socials:
                socials[network] = url

        # تفکیک نام و نام خانوادگی
        full_name = (basics.get("name") or "").strip()
        name_parts = full_name.split(" ", 1)
        first_name = name_parts[0] if len(name_parts) > 0 else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        # تجمیع متن‌های درباره من
        about_parts = [
            (data.get("aboutText1") or "").strip(),
            (data.get("aboutText2") or "").strip(),
            (data.get("aboutText3") or "").strip(),
        ]
        bio_full = "\n\n".join([part for part in about_parts if part])
        if not bio_full:
            bio_full = (basics.get("summary") or "").strip()

        obj, created = SiteProfile.objects.update_or_create(
            email=(basics.get("email") or "").strip(),
            defaults={
                "first_name": first_name,
                "last_name": last_name,
                "title": (basics.get("label") or "").strip(),
                "bio": bio_full,
                "phone": (basics.get("phone") or "").strip(),
                "github": socials["github"],
                "linkedin": socials["linkedin"],
                "telegram": socials["telegram"],
                "instagram": socials["instagram"],
                "meta_title": self._truncate(
                    f"{full_name} - {basics.get('label')}", 150
                ),
                "meta_description": self._truncate(
                    basics.get("summary") or bio_full, 300
                ),
                "is_active": True,
                "is_deleted": False,
            },
        )

        action = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(f"{action} SiteProfile: {first_name} {last_name}")
        )

    def _import_experiences(self, experiences):
        for item in experiences:
            title = (item.get("title") or "").strip()
            company = (item.get("company") or "").strip()
            location = (item.get("location") or "").strip()
            duties = item.get("duties") or []

            # پارس کردن فیلد متنی تاریخ (مثلا "May 2023 - Present" یا "Jun 2021 - May 2023")
            dates_str = (item.get("dates") or "").strip()
            start_date, end_date, is_current = self._parse_experience_dates(dates_str)

            description = "\n".join(
                [f"- {d.strip()}" for d in duties if d.strip()]
            ).strip()

            if not title or not company:
                continue

            obj, created = Experience.objects.update_or_create(
                title=title,
                company=company,
                defaults={
                    "location": location,
                    "start_date": start_date
                    or datetime.now().date(),  # مقدار پیش‌فرض در صورت نامعتبر بودن فرمت تاریخ
                    "end_date": end_date,
                    "is_current": is_current,
                    "description": description,
                    "is_active": True,
                    "is_deleted": False,
                },
            )

            action = "Created" if created else "Updated"
            self.stdout.write(f"{action} Experience: {title} @ {company}")

    def _import_projects(self, projects):
        for index, item in enumerate(projects, start=1):
            title = (item.get("title") or "").strip()
            if not title:
                continue

            tech_stack = (item.get("tech_stack") or "").strip()
            description = (
                item.get("description_full") or item.get("description_short") or ""
            ).strip()

            obj, created = Project.objects.update_or_create(
                title=title,
                defaults={
                    "description": description,
                    "technologies": tech_stack or "Not Specified",
                    # از آنجا که فیلد image در مدل شما اجباری (null=False) تعریف شده است،
                    # مقدار موقتی قرار داده شده تا بعداً از ادمین آپلود شود
                    "image": "projects/default.png",
                    "demo_url": (item.get("demo_link") or "").strip() or None,
                    "source_url": None,
                    "is_featured": False,
                    "order": index,
                    "is_active": True,
                    "is_deleted": False,
                },
            )

            action = "Created" if created else "Updated"
            self.stdout.write(f"{action} Project: {title}")

    def _import_skills(self, skills_obj):
        if not isinstance(skills_obj, dict):
            return

        # تبدیل سطح مهارت متنی/عددی به مقادیر Choices مدل شما (۱ تا ۴)
        # LEVEL_CHOICES = [(1, مبتدی), (2, متوسط), (3, پیشرفته), (4, متخصص)]
        for index, (category_key, raw_values) in enumerate(skills_obj.items(), start=1):
            category_title = category_key.replace("_", " ").title()

            category, created = SkillCategory.objects.update_or_create(
                name=category_title,
                defaults={
                    "order": index,
                    "is_active": True,
                    "is_deleted": False,
                },
            )

            self.stdout.write(
                f"{'Created' if created else 'Updated'} SkillCategory: {category_title}"
            )

            skill_names = [s.strip() for s in str(raw_values).split(",") if s.strip()]
            for skill_index, skill_name in enumerate(skill_names, start=1):
                # تعیین سطح پیش‌فرض پیشرفته (3) برای مهارت‌ها
                level_val = 3

                # برای برخی مهارت‌های خاص سطح متخصص (4)
                if skill_name.lower() in [
                    "python",
                    "django",
                    "javascript",
                    "postgresql",
                ]:
                    level_val = 4

                skill_obj, skill_created = Skill.objects.update_or_create(
                    category=category,
                    name=skill_name,
                    defaults={
                        "level": level_val,
                        "icon_class": self._suggest_icon_class(skill_name),
                        "is_active": True,
                    },
                )

                self.stdout.write(
                    f"{'Created' if skill_created else 'Updated'} Skill: {skill_name}"
                )

    def _import_certificates(self, certifications):
        for item in certifications:
            title = (item.get("name") or "").strip()
            issuer = (item.get("issuer") or "").strip()
            date_text = (item.get("date") or "").strip()

            if not title:
                continue

            issue_date = self._parse_single_date(date_text) or datetime.now().date()

            obj, created = Certificate.objects.update_or_create(
                title=title,
                issuer=issuer,
                defaults={
                    "issue_date": issue_date,
                    "is_active": True,
                    "is_deleted": False,
                },
            )

            action = "Created" if created else "Updated"
            self.stdout.write(f"{action} Certificate: {title}")

    def _truncate(self, text, max_len):
        text = (text or "").strip()
        return text[:max_len]

    def _parse_single_date(self, value):
        value = (value or "").strip()
        if not value:
            return None
        for fmt in ("%B %Y", "%b %Y", "%Y-%m-%d", "%Y-%m"):
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                continue
        return None

    def _parse_experience_dates(self, date_str):
        # نمونه ورودی: "Jul 2024 - Present" یا "Jun 2021 - May 2023"
        start_date = None
        end_date = None
        is_current = False

        if not date_str:
            return start_date, end_date, is_current

        parts = [p.strip() for p in date_str.split("-")]

        # پارس کردن زمان شروع
        if len(parts) >= 1:
            start_date = self._parse_single_date(parts[0])

        # پارس کردن زمان پایان
        if len(parts) >= 2:
            end_part = parts[1].lower()
            if "present" in end_part or "now" in end_part:
                is_current = True
            else:
                end_date = self._parse_single_date(parts[1])
        else:
            is_current = True

        return start_date, end_date, is_current

    def _suggest_icon_class(self, skill_name):
        skill_lower = skill_name.lower()
        if "python" in skill_lower:
            return "fab fa-python"
        elif "django" in skill_lower:
            return "devicon-django-plain"
        elif "js" in skill_lower or "javascript" in skill_lower:
            return "fab fa-js"
        elif "html" in skill_lower:
            return "fab fa-html5"
        elif "css" in skill_lower:
            return "fab fa-css3-alt"
        elif "postgres" in skill_lower:
            return "devicon-postgresql-plain"
        elif "wp" in skill_lower or "wordpress" in skill_lower:
            return "fab fa-wordpress"
        return "fas fa-code"
