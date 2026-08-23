from django.db import models
from django.utils.translation import gettext_lazy as _

# ==============================================================================
# BASE CLASSES
# ==============================================================================


class ActiveManager(models.Manager):
    """
    Manager to return only active and non-deleted records.
    """

    def get_queryset(self):
        return super().get_queryset().filter(is_active=True, is_deleted=False)


class TimeMixin(models.Model):
    """
    Abstract mixin to add created_at and updated_at timestamps.
    """

    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Created at"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Updated at"))

    class Meta:
        abstract = True


class SoftDeleteModel(TimeMixin):
    """
    Abstract model to support soft deletion.
    """

    is_active = models.BooleanField(default=True, verbose_name=_("Is Active"))
    is_deleted = models.BooleanField(default=False, verbose_name=_("Is Deleted"))

    objects = models.Manager()
    active_objects = ActiveManager()

    class Meta:
        abstract = True

    def delete(self, *args, **kwargs):
        self.is_deleted = True
        self.save()

    def hard_delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)


# ==============================================================================
# MODELS
# ==============================================================================


class SiteProfile(SoftDeleteModel):
    first_name = models.CharField(max_length=100, verbose_name=_("First Name"))
    last_name = models.CharField(max_length=100, verbose_name=_("Last Name"))
    title = models.CharField(max_length=200, verbose_name=_("Job Title"))
    bio = models.TextField(verbose_name=_("Biography"))
    avatar = models.ImageField(upload_to="avatars/", verbose_name=_("Avatar"))
    resume = models.FileField(
        upload_to="resumes/", blank=True, null=True, verbose_name=_("Resume (Persian)")
    )
    resume_en = models.FileField(
        upload_to="resumes/", blank=True, null=True, verbose_name=_("Resume (English)")
    )
    email = models.EmailField(verbose_name=_("Email"))
    phone = models.CharField(max_length=20, verbose_name=_("Phone"))
    github = models.URLField(blank=True, null=True, verbose_name=_("GitHub"))
    linkedin = models.URLField(blank=True, null=True, verbose_name=_("LinkedIn"))
    telegram = models.CharField(
        max_length=100, blank=True, null=True, verbose_name=_("Telegram")
    )
    instagram = models.CharField(
        max_length=100, blank=True, null=True, verbose_name=_("Instagram")
    )

    meta_title = models.CharField(max_length=255, verbose_name=_("Meta Title"))
    meta_description = models.TextField(verbose_name=_("Meta Description"))
    meta_keywords = models.CharField(max_length=255, verbose_name=_("Meta Keywords"))

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.title}"


class Project(SoftDeleteModel):
    title = models.CharField(max_length=200, verbose_name=_("Title"))
    description = models.TextField(verbose_name=_("Description"))
    technologies = models.CharField(max_length=255, verbose_name=_("Technologies"))
    image = models.ImageField(upload_to="projects/", verbose_name=_("Image"))
    demo_url = models.URLField(blank=True, null=True, verbose_name=_("Demo URL"))
    source_url = models.URLField(blank=True, null=True, verbose_name=_("Source URL"))

    # New Fields
    start_date = models.DateField(blank=True, null=True, verbose_name=_("Start Date"))
    end_date = models.DateField(blank=True, null=True, verbose_name=_("End Date"))
    is_completed = models.BooleanField(default=False, verbose_name=_("Is Completed"))
    is_open_source = models.BooleanField(
        default=False, verbose_name=_("Is Open Source")
    )

    is_featured = models.BooleanField(default=False, verbose_name=_("Is Featured"))
    order = models.PositiveIntegerField(default=0, verbose_name=_("Order"))

    class Meta:
        ordering = ["order", "-created_at"]


class SkillCategory(SoftDeleteModel):
    name = models.CharField(max_length=100, verbose_name=_("Name"))
    order = models.PositiveIntegerField(default=0, verbose_name=_("Order"))

    class Meta:
        ordering = ["order"]


class Skill(TimeMixin):
    LEVEL_CHOICES = (
        (1, _("Beginner")),
        (2, _("Intermediate")),
        (3, _("Advanced")),
        (4, _("Expert")),
    )
    category = models.ForeignKey(
        SkillCategory,
        on_delete=models.CASCADE,
        related_name="skills",
        verbose_name=_("Category"),
    )
    name = models.CharField(max_length=100, verbose_name=_("Name"))
    level = models.IntegerField(choices=LEVEL_CHOICES, verbose_name=_("Level"))
    icon_class = models.CharField(
        max_length=50, blank=True, null=True, verbose_name=_("Icon Class")
    )
    is_active = models.BooleanField(default=True, verbose_name=_("Is Active"))


class Experience(SoftDeleteModel):
    title = models.CharField(max_length=200, verbose_name=_("Title"))
    company = models.CharField(max_length=200, verbose_name=_("Company"))
    location = models.CharField(max_length=200, verbose_name=_("Location"))
    start_date = models.DateField(verbose_name=_("Start Date"))
    end_date = models.DateField(blank=True, null=True, verbose_name=_("End Date"))
    is_current = models.BooleanField(default=False, verbose_name=_("Is Current"))
    description = models.TextField(verbose_name=_("Description"))

    class Meta:
        ordering = ["-start_date"]


class Certificate(SoftDeleteModel):
    title = models.CharField(max_length=200, verbose_name=_("Title"))
    issuer = models.CharField(max_length=200, verbose_name=_("Issuer"))
    issue_date = models.DateField(verbose_name=_("Issue Date"))
    expiration_date = models.DateField(
        blank=True, null=True, verbose_name=_("Expiration Date")
    )
    credential_id = models.CharField(
        max_length=100, blank=True, null=True, verbose_name=_("Credential ID")
    )
    credential_url = models.URLField(
        blank=True, null=True, verbose_name=_("Credential URL")
    )

    class Meta:
        ordering = ["-issue_date"]


class ContactSubmission(TimeMixin):
    name = models.CharField(max_length=100, verbose_name=_("Name"))
    email = models.EmailField(verbose_name=_("Email"))
    subject = models.CharField(max_length=200, verbose_name=_("Subject"))
    message = models.TextField(verbose_name=_("Message"))
    is_read = models.BooleanField(default=False, verbose_name=_("Is Read"))

    class Meta:
        ordering = ["-created_at"]
