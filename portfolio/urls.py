from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

admin.site.site_header = "پنل مدیریت پورتفولیو dot1mav"
admin.site.site_title = "مدیریت dot1mav"
admin.site.index_title = "به پنل مدیریت خوش آمدید، امین"

def api_root(request):
    return JsonResponse({"name": "dot1mav portfolio API", "status": "ok"})


urlpatterns = [
    path("", api_root, name="api-root"),
    path(settings.ADMIN_URL, admin.site.urls),
    path("v0/", include("api.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
