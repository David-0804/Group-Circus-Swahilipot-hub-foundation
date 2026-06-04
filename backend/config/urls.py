from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/equipment/', include('equipment.urls')),
    path('api/v1/projects/', include('projects.urls')),
    path('api/v1/fm/', include('fm_broadcast.urls')),
    path('api/v1/news/', include('news.urls')),
    path('api/v1/infrastructure/', include('infrastructure.urls')),
    path('api/v1/videography/', include('videography.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
