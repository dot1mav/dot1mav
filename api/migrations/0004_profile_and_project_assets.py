from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("api", "0003_fix_nullable_fields")]

    operations = [
        migrations.AddField(
            model_name="siteprofile", name="location",
            field=models.CharField(default="", max_length=255, blank=True),
        ),
        migrations.AddField(
            model_name="siteprofile", name="website",
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="project", name="images",
            field=models.JSONField(default=list, blank=True),
        ),
        migrations.AddField(
            model_name="project", name="video",
            field=models.URLField(blank=True, null=True),
        ),
    ]
