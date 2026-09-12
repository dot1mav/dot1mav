from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import (
    SiteProfile,
    Project,
    SkillCategory,
    Experience,
    Certificate,
)
from .serializers import (
    SiteProfileSerializer,
    ProjectSerializer,
    SkillCategorySerializer,
    ExperienceSerializer,
    CertificateSerializer,
    ContactSubmissionSerializer,
)


class SiteProfileAPIView(APIView):
    """
    GET /v0/profile/
    بازگرداندن اطلاعات سینگلتون پروفایل سایت
    """

    def get(self, request):
        profile = get_object_or_404(SiteProfile.active_objects)
        serializer = SiteProfileSerializer(profile, context={"request": request})
        return Response(serializer.data)


class ProjectListAPIView(generics.ListAPIView):
    """
    GET /v0/projects/
    لیست تمام پروژه‌های فعال
    """

    serializer_class = ProjectSerializer
    queryset = Project.active_objects.all().order_by("order")


class ProjectDetailAPIView(generics.RetrieveAPIView):
    """
    GET /v0/projects/<slug>/
    جزئیات یک پروژه بر اساس slug
    """

    serializer_class = ProjectSerializer
    queryset = Project.objects.filter(is_active=True)
    def get_object(self):
        from django.utils.text import slugify
        from rest_framework.exceptions import NotFound
        slug = self.kwargs["slug"]
        for project in self.get_queryset():
            if slugify(project.title) == slug:
                return project
        raise NotFound("Project not found.")


class SkillListAPIView(generics.ListAPIView):
    """
    GET /v0/skills/
    لیست دسته‌بندی مهارت‌ها با مهارت‌های فعال داخل هر دسته
    """

    serializer_class = SkillCategorySerializer
    queryset = SkillCategory.active_objects.all().order_by("order")

    def get_queryset(self):
        # برای بهینه‌سازی پرس‌وجو
        return super().get_queryset().prefetch_related("skills")


class ExperienceListAPIView(generics.ListAPIView):
    """
    GET /v0/experiences/
    """

    serializer_class = ExperienceSerializer
    queryset = Experience.active_objects.all()


class CertificateListAPIView(generics.ListAPIView):
    """
    GET /v0/certificates/
    """

    serializer_class = CertificateSerializer
    queryset = Certificate.active_objects.all()


class ContactSubmissionAPIView(APIView):
    """
    POST /v0/contact/
    ارسال پیام تماس
    """

    def post(self, request):
        serializer = ContactSubmissionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"detail": "پیام شما با موفقیت ثبت شد."},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
