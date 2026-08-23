from django.core.management.base import BaseCommand
from django.db.models import Q

from api.models import SiteProfile


class Command(BaseCommand):
    help = "Fill missing SEO (meta) fields for SiteProfile records"

    def handle(self, *args, **options):
        queryset = SiteProfile.objects.filter(
            Q(meta_title__isnull=True)
            | Q(meta_title="")
            | Q(meta_description__isnull=True)
            | Q(meta_description="")
        )

        count = 0

        for obj in queryset:
            changed = False
            full_name = f"{obj.first_name} {obj.last_name}".strip()

            if not obj.meta_title:
                obj.meta_title = self._truncate(
                    f"{full_name} - {obj.title}".strip(" -"), 150
                )
                changed = True

            if not obj.meta_description:
                obj.meta_description = self._truncate(
                    obj.bio or obj.title or full_name, 300
                )
                changed = True

            if not obj.meta_keywords:
                # حدس زدن کلمات کلیدی اولیه بر اساس نام و تخصص
                keywords = [obj.first_name, obj.last_name, obj.title]
                obj.meta_keywords = self._truncate(
                    ", ".join([k for k in keywords if k]), 255
                )
                changed = True

            if changed:
                obj.save(
                    update_fields=["meta_title", "meta_description", "meta_keywords"]
                )
                count += 1
                self.stdout.write(f"Updated SEO Meta fields for: {full_name}")

        self.stdout.write(
            self.style.SUCCESS(f"SEO fill completed. Updated {count} record(s).")
        )

    def _truncate(self, text, max_len):
        return (text or "").strip()[:max_len]
