from rest_framework import serializers
from .models import (
    SiteProfile,
    Project,
    Skill,
    SkillCategory,
    Experience,
    Certificate,
    ContactSubmission,
)


class SiteProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    resume_url = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    job_title = serializers.SerializerMethodField()
    bio_short = serializers.SerializerMethodField()
    bio_full = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    website_url = serializers.SerializerMethodField()
    github_url = serializers.SerializerMethodField()
    linkedin_url = serializers.SerializerMethodField()

    class Meta:
        model = SiteProfile
        fields = [
            "full_name",
            "job_title",
            "bio_short",
            "bio_full",
            "email",
            "phone",
            "location",
            "website_url",
            "github_url",
            "linkedin_url",
            "telegram",
            "instagram",
            "avatar_url",
            "resume_url",
            "meta_title",
            "meta_description",
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_job_title(self, obj):
        return obj.title

    def get_bio_short(self, obj):
        text = obj.bio or ""
        sentences = text.split(". ")
        return ". ".join(sentences[:2]) + ("." if sentences else "")

    def get_bio_full(self, obj):
        return obj.bio or ""

    def get_location(self, obj):
        return ""

    def get_website_url(self, obj):
        return None

    def get_github_url(self, obj):
        return obj.github

    def get_linkedin_url(self, obj):
        return obj.linkedin

    def get_absolute_file_url(self, obj, field_name):
        file_field = getattr(obj, field_name, None)
        if file_field:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(file_field.url)
            return file_field.url
        return None

    def get_avatar_url(self, obj):
        return self.get_absolute_file_url(obj, "avatar")

    def get_resume_url(self, obj):
        return self.get_absolute_file_url(obj, "resume")


class ProjectSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    slug = serializers.SerializerMethodField()
    description_short = serializers.SerializerMethodField()
    description_full = serializers.SerializerMethodField()
    tech_stack = serializers.SerializerMethodField()
    demo_link = serializers.SerializerMethodField()
    source_link = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "slug",
            "description_short",
            "description_full",
            "tech_stack",
            "image_url",
            "demo_link",
            "source_link",
            "date",
            "is_featured",
        ]

    def get_slug(self, obj):
        return obj.title.lower().replace(" ", "-").replace("/", "-")

    def get_description_short(self, obj):
        text = obj.description or ""
        sentences = text.split(". ")
        return ". ".join(sentences[:2]) + ("." if sentences else "")

    def get_description_full(self, obj):
        return obj.description or ""

    def get_tech_stack(self, obj):
        return obj.technologies or ""

    def get_demo_link(self, obj):
        return obj.demo_url

    def get_source_link(self, obj):
        return obj.source_url

    def get_date(self, obj):
        if obj.start_date:
            return obj.start_date.strftime("%Y-%m-%d")
        return None

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class SkillSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    icon = serializers.SerializerMethodField()

    class Meta:
        model = Skill
        fields = ["id", "title", "level", "icon"]

    def get_title(self, obj):
        return obj.name

    def get_icon(self, obj):
        return obj.icon_class or ""


class SkillCategorySerializer(serializers.ModelSerializer):
    skills = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()

    class Meta:
        model = SkillCategory
        fields = ["id", "title", "skills"]

    def get_title(self, obj):
        return obj.name

    def get_skills(self, obj):
        skills = obj.skills.filter(is_active=True).order_by("name")
        return SkillSerializer(skills, many=True).data


class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = [
            "id",
            "title",
            "company",
            "location",
            "description",
            "start_date",
            "end_date",
            "is_current",
        ]


class CertificateSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = [
            "id",
            "title",
            "issuer",
            "issue_date",
            "credential_url",
            "image_url",
        ]

    def get_image_url(self, obj):
        return None


class ContactSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactSubmission
        fields = ["name", "email", "subject", "message"]

    def validate_message(self, value):
        if len(value) < 10:
            raise serializers.ValidationError("Message must be at least 10 characters.")
        return value
