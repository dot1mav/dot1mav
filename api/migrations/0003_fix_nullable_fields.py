from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_alter_project_options_alter_siteprofile_options_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="experience",
            name="location",
            field=models.CharField(max_length=200),
        ),
        migrations.AlterField(
            model_name="siteprofile",
            name="avatar",
            field=models.ImageField(upload_to="avatars/"),
        ),
    ]
