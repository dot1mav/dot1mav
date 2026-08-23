from django.urls import path
from . import views

app_name = "api"

urlpatterns = [
    path("profile/", views.SiteProfileAPIView.as_view(), name="profile"),
    path("projects/", views.ProjectListAPIView.as_view(), name="project-list"),
    path(
        "projects/<slug:slug>/",
        views.ProjectDetailAPIView.as_view(),
        name="project-detail",
    ),
    path("skills/", views.SkillListAPIView.as_view(), name="skill-list"),
    path(
        "experiences/",
        views.ExperienceListAPIView.as_view(),
        name="experience-list",
    ),
    path(
        "certificates/",
        views.CertificateListAPIView.as_view(),
        name="certificate-list",
    ),
    path("contact/", views.ContactSubmissionAPIView.as_view(), name="contact"),
]
