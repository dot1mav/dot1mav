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
    GET /api/profile/
    بازگرداندن اطلاعات سینگلتون پروفایل سایت
    """

    def get(self, request):
        profile = get_object_or_404(SiteProfile, is_active=True)
        serializer = SiteProfileSerializer(profile, context={"request": request})
        return Response(serializer.data)


class ProjectListAPIView(generics.ListAPIView):
    """
    GET /api/projects/
    لیست تمام پروژه‌های فعال
    """

    serializer_class = ProjectSerializer
    queryset = Project.objects.filter(is_active=True).order_by("order")


class ProjectDetailAPIView(generics.RetrieveAPIView):
    """
    GET /api/projects/<slug>/
    جزئیات یک پروژه بر اساس slug
    """

    serializer_class = ProjectSerializer
    queryset = Project.objects.filter(is_active=True)
    lookup_field = "slug"


class SkillListAPIView(generics.ListAPIView):
    """
    GET /api/skills/
    لیست دسته‌بندی مهارت‌ها با مهارت‌های فعال داخل هر دسته
    """

    serializer_class = SkillCategorySerializer
    queryset = SkillCategory.objects.filter(is_active=True).order_by("order")

    def get_queryset(self):
        # برای بهینه‌سازی پرس‌وجو
        return super().get_queryset().prefetch_related("skills")


class ExperienceListAPIView(generics.ListAPIView):
    """
    GET /v0/experiences/
    """

    serializer_class = ExperienceSerializer
    queryset = Experience.objects.filter(is_active=True)


class CertificateListAPIView(generics.ListAPIView):
    """
    GET /v0/certificates/
    """

    serializer_class = CertificateSerializer
    queryset = Certificate.objects.filter(is_active=True)


class ContactSubmissionAPIView(APIView):
    """
    POST /api/contact/
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
