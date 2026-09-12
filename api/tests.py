from datetime import date
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from .models import Certificate, ContactSubmission, Experience, Project, SiteProfile, Skill, SkillCategory


class EndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        SiteProfile.objects.create(first_name="Mohammad", last_name="Vakili", title="Engineer",
            bio="A software engineer.", email="test@example.com", phone="", avatar="avatars/test.jpg",
            location="Bandar Abbas", website="https://example.com")
        Project.objects.create(title="Demo Project", description="First. Second.", technologies="Django",
            image="projects/demo.png", start_date=date(2025, 1, 1),
            images=["/images/projects/demo.svg"], video="https://example.com/demo.mp4")
        category = SkillCategory.objects.create(name="Backend")
        Skill.objects.create(category=category, name="Django", level=4)
        Experience.objects.create(title="Developer", company="Acme", location="Remote",
            start_date=date(2024, 1, 1), description="Built APIs.")
        Certificate.objects.create(title="Security+", issuer="TVTO", issue_date=date(2024, 1, 1))

    def test_read_endpoints_and_project_slug(self):
        for name in ("api:profile", "api:project-list", "api:skill-list",
                     "api:experience-list", "api:certificate-list"):
            self.assertEqual(self.client.get(reverse(name)).status_code, 200)
        detail = self.client.get(reverse("api:project-detail", args=["demo-project"]))
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.json()["images"], ["/images/projects/demo.svg"])

    def test_contact_validation_and_create(self):
        bad = self.client.post(reverse("api:contact"),
            {"name": "A", "email": "bad", "subject": "x", "message": "short"}, format="json")
        self.assertEqual(bad.status_code, 400)
        good = self.client.post(reverse("api:contact"),
            {"name": "Ali", "email": "ali@example.com", "subject": "Hello",
             "message": "This is a valid contact message."}, format="json")
        self.assertEqual(good.status_code, 201)
        self.assertEqual(ContactSubmission.objects.count(), 1)

    def test_read_endpoints_do_not_allow_mutation(self):
        self.assertEqual(self.client.post(reverse("api:project-list"), {}, format="json").status_code, 405)


class SecurityTests(TestCase):
    def test_security_headers_and_admin_authentication(self):
        # Always resolved from settings so the test follows whatever
        # ADMIN_URL the environment sets.
        response = self.client.get(f"/{settings.ADMIN_URL}")
        self.assertIn(response.status_code, (301, 302))
        self.assertIn("X-Content-Type-Options", response.headers)
        self.assertEqual(response.headers.get("X-Frame-Options"), "DENY")

    def test_admin_requires_staff(self):
        User = get_user_model()
        User.objects.create_user(username="normal", password="Strong-password-123")
        self.client.login(username="normal", password="Strong-password-123")
        self.assertEqual(self.client.get(f"/{settings.ADMIN_URL}").status_code, 302)
