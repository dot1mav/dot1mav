from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import (
    SiteProfile,
    Project,
    SkillCategory,
    Skill,
    Experience,
    Certificate,
    ContactSubmission,
)


def activate_records(modeladmin, request, queryset):
    queryset.update(is_active=True, is_deleted=False)
activate_records.short_description = "Activate selected records"


def soft_delete_records(modeladmin, request, queryset):
    queryset.update(is_active=False, is_deleted=True)
soft_delete_records.short_description = "Soft-delete selected records"


def restore_records(modeladmin, request, queryset):
    queryset.update(is_active=True, is_deleted=False)
restore_records.short_description = "Restore selected records"

# ==============================================================================
# BASE CONFIG & MIXINS
# ==============================================================================


class CustomAdminStyleMixin:
    """
    Injects custom CSS for RTL support and modern UI elements.
    """

    class Media:
        css = {
            "all": ("admin/css/admin_custom.css",),
        }


# ==============================================================================
# SITE PROFILE MANAGEMENT
# ==============================================================================


@admin.register(SiteProfile)
class SiteProfileAdmin(CustomAdminStyleMixin, admin.ModelAdmin):
    actions = [activate_records, soft_delete_records, restore_records]
    list_display = (
        "full_name",
        "title",
        "email",
        "has_fa_resume",
        "has_en_resume",
        "is_active",
    )
    list_filter = ("is_active", "is_deleted")
    search_fields = ("first_name", "last_name", "title", "email")

    fieldsets = (
        (
            "Personal Info",
            {"fields": ("first_name", "last_name", "title", "bio", "avatar")},
        ),
        (
            "Resumes (Assets)",
            {"fields": ("resume", "resume_en")},
        ),  # اضافه شدن رزومه انگلیسی
        (
            "Contact & Socials",
            {
                "fields": (
                    "email",
                    "phone",
                    "github",
                    "linkedin",
                    "telegram",
                    "instagram",
                )
            },
        ),
        (
            "SEO Meta",
            {
                "fields": ("meta_title", "meta_description", "meta_keywords"),
                "classes": ("collapse",),
            },
        ),
        ("Settings", {"fields": ("is_active", "is_deleted")}),
    )

    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    full_name.short_description = "Full Name"

    def has_fa_resume(self, obj):
        if obj.resume:
            return mark_safe(
                '<span style="color: #2e7d32; font-weight: bold;">✔ FA Resume</span>'
            )
        return mark_safe('<span style="color: #c62828;">✘ No</span>')

    has_fa_resume.short_description = "FA Resume"

    def has_en_resume(self, obj):
        if obj.resume_en:
            return mark_safe(
                '<span style="color: #2e7d32; font-weight: bold;">✔ EN Resume</span>'
            )
        return mark_safe('<span style="color: #c62828;">✘ No</span>')

    has_en_resume.short_description = "EN Resume"


# ==============================================================================
# PROJECT PORTFOLIO MANAGEMENT
# ==============================================================================


@admin.register(Project)
class ProjectAdmin(CustomAdminStyleMixin, admin.ModelAdmin):
    actions = [activate_records, soft_delete_records, restore_records]
    list_display = (
        "title",
        "image_preview",
        "is_open_source_badge",
        "project_status",
        "is_featured_badge",
        "order",
        "is_active",
    )
    list_editable = ("order", "is_active")
    list_filter = (
        "is_open_source",
        "is_completed",
        "is_featured",
        "is_active",
        "is_deleted",
    )
    search_fields = ("title", "description", "technologies")
    ordering = ("order", "-created_at")

    fieldsets = (
        (
            "Basic Info",
            {"fields": ("title", "description", "technologies", "image", "order")},
        ),
        (
            "Status & Classification",
            {"fields": ("is_open_source", "is_completed", "is_featured", "is_active")},
        ),
        ("Dates", {"fields": ("start_date", "end_date")}),
        ("Links", {"fields": ("demo_url", "source_url")}),
    )

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;" />',
                obj.image.url,
            )
        return mark_safe('<span style="color: #bbb;">No Image</span>')

    image_preview.short_description = "Preview"

    def is_featured_badge(self, obj):
        if obj.is_featured:
            return mark_safe(
                '<span style="background-color: #ffd700; color: #333; padding: 2px 8px; '
                'border-radius: 12px; font-weight: bold; font-size: 11px;">⭐ Featured</span>'
            )
        return mark_safe('<span style="color: #888;">Standard</span>')

    is_featured_badge.short_description = "Featured"

    def is_open_source_badge(self, obj):
        if obj.is_open_source:
            return mark_safe(
                '<span style="background-color: #007bff; color: white; padding: 2px 8px; '
                'border-radius: 12px; font-weight: bold; font-size: 11px;">🌐 Open Source</span>'
            )
        return mark_safe('<span style="color: #888;">Private/Client</span>')

    is_open_source_badge.short_description = "Type"

    def project_status(self, obj):
        if obj.is_completed:
            status_text = "Completed"
            color = "#28a745"
        else:
            status_text = "In Progress"
            color = "#ffc107"

        date_str = ""
        if obj.start_date:
            start = obj.start_date.strftime("%Y/%m")
            end = (
                obj.end_date.strftime("%Y/%m")
                if (obj.is_completed and obj.end_date)
                else "Present"
            )
            date_str = f" ({start} - {end})"

        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span><span style="font-size: 11px; color: #666;">{}</span>',
            color,
            status_text,
            date_str,
        )

    project_status.short_description = "Status / Duration"


# ==============================================================================
# SKILLS MANAGEMENT
# ==============================================================================


class SkillInline(admin.TabularInline):
    model = Skill
    extra = 1


@admin.register(SkillCategory)
class SkillCategoryAdmin(CustomAdminStyleMixin, admin.ModelAdmin):
    actions = [activate_records, soft_delete_records, restore_records]
    list_display = ("name", "order", "is_active")
    list_editable = ("order", "is_active")
    inlines = [SkillInline]


@admin.register(Skill)
class SkillAdmin(CustomAdminStyleMixin, admin.ModelAdmin):
    actions = ["activate_skills", "deactivate_skills"]
    list_display = ("name", "category", "level_bar", "is_active")
    list_filter = ("category", "is_active")

    def level_bar(self, obj):
        return format_html(
            '<div style="width:100px; background:#eee; border-radius:4px;">'
            '<div style="width:{}%; background:#17a2b8; height:10px; border-radius:4px;"></div>'
            "</div>",
            obj.level,
        )

    @admin.action(description="Activate selected skills")
    def activate_skills(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description="Deactivate selected skills")
    def deactivate_skills(self, request, queryset):
        queryset.update(is_active=False)

    level_bar.short_description = "Proficiency"


# ==============================================================================
# WORK EXPERIENCE MANAGEMENT
# ==============================================================================


@admin.register(Experience)
class ExperienceAdmin(CustomAdminStyleMixin, admin.ModelAdmin):
    actions = [activate_records, soft_delete_records, restore_records]
    list_display = ("title", "company", "period_display", "status_badge", "is_active")
    list_filter = ("is_active", "is_current")
    search_fields = ("title", "company", "description")
    ordering = ("-start_date",)

    def period_display(self, obj):
        start = obj.start_date.strftime("%Y/%m") if obj.start_date else "N/A"
        end = (
            "Present"
            if obj.is_current
            else (obj.end_date.strftime("%Y/%m") if obj.end_date else "N/A")
        )
        return f"{start} - {end}"

    period_display.short_description = "Period"

    def status_badge(self, obj):
        if obj.is_current:
            return mark_safe(
                '<span style="background-color: #28a745; color: white; padding: 2px 8px; '
                'border-radius: 4px; font-size: 11px; font-weight: bold;">Active</span>'
            )
        return mark_safe(
            '<span style="background-color: #6c757d; color: white; padding: 2px 8px; '
            'border-radius: 4px; font-size: 11px;">Completed</span>'
        )

    status_badge.short_description = "Status"


# ==============================================================================
# CERTIFICATES & CONTACT
# ==============================================================================


@admin.register(Certificate)
class CertificateAdmin(CustomAdminStyleMixin, admin.ModelAdmin):
    actions = [activate_records, soft_delete_records, restore_records]
    list_display = ("title", "issuer", "issue_date", "is_active")


@admin.register(ContactSubmission)
class ContactSubmissionAdmin(CustomAdminStyleMixin, admin.ModelAdmin):
    list_display = ("name", "email", "subject", "is_read", "created_at")
    readonly_fields = ("name", "email", "subject", "message", "created_at")
    list_filter = ("is_read", "created_at")
    actions = ["mark_as_read", "mark_as_unread"]

    def has_add_permission(self, request):
        return False

    @admin.action(description="Mark selected messages as read")
    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)

    @admin.action(description="Mark selected messages as unread")
    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False)
