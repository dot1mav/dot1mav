import os
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create or update a Django superuser without interactive input."

    def add_arguments(self, parser):
        parser.add_argument("--username", default=None)
        parser.add_argument("--email", default=None)
        parser.add_argument("--password", default=None)

    def handle(self, *args, **options):
        username = options["username"] or os.getenv("DJANGO_SUPERUSER_USERNAME")
        email = options["email"] or os.getenv("DJANGO_SUPERUSER_EMAIL", "")
        password = options["password"] or os.getenv("DJANGO_SUPERUSER_PASSWORD")
        if not username:
            raise CommandError("Username is required.")
        if not password:
            raise CommandError("Password is required.")
        if len(password) < 12:
            raise CommandError("Password must be at least 12 characters.")
        model = get_user_model()
        user, created = model.objects.get_or_create(
            **{model.USERNAME_FIELD: username},
            defaults={"email": email, "is_staff": True, "is_superuser": True},
        )
        user.email = email
        user.is_staff = user.is_superuser = True
        user.set_password(password)
        user.save()
        self.stdout.write(self.style.SUCCESS(
            f"{'Created' if created else 'Updated'} admin user: {username}"
        ))
