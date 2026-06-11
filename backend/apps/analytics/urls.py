"""Nexus Analytics — URLs"""
from django.urls import path
from .views import (
    AnalyticsDashboardView, AttendanceAnalyticsView, ExportView,
)

urlpatterns = [
    path('dashboard/',          AnalyticsDashboardView.as_view(),   name='analytics-dashboard'),
    path('attendance/',         AttendanceAnalyticsView.as_view(),  name='analytics-attendance'),
    path('export/<str:module>/',ExportView.as_view(),               name='analytics-export'),
]
