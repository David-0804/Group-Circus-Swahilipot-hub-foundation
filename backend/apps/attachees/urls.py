from django.urls import path
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .attachee_bulk_views import (
    AttacheeBulkImportView,
    BulkImportTemplateView,
    AssignSupervisorView,
    DeassignSupervisorView,
    ToggleAttacheeActiveView,
)


class ModuleView(APIView):
    permission_classes = [IsAuthenticated]
    

urlpatterns = [
    # Existing
    path('', ModuleView.as_view()),
    path('<uuid:pk>/', ModuleView.as_view()),

    # Bulk import
    path('bulk-import/', AttacheeBulkImportView.as_view(), name='attachee-bulk-import'),
    path('bulk-import/template/', BulkImportTemplateView.as_view(), name='attachee-import-template'),

    # Per-attachee management
    path('<uuid:pk>/assign-supervisor/', AssignSupervisorView.as_view(), name='attachee-assign-supervisor'),
    path('<uuid:pk>/deassign-supervisor/', DeassignSupervisorView.as_view(), name='attachee-deassign-supervisor'),
    path('<uuid:pk>/toggle-active/', ToggleAttacheeActiveView.as_view(), name='attachee-toggle-active'),
]