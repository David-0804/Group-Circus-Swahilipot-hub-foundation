"""Nexus Notifications — URLs"""
from django.urls import path
from .models import (
    NotificationListView, NotificationDetailView,
    MarkAllReadView, UnreadCountView, NotificationPreferenceView,
)

urlpatterns = [
    path('',                    NotificationListView.as_view(),      name='notification-list'),
    path('<uuid:pk>/',          NotificationDetailView.as_view(),    name='notification-detail'),
    path('mark-all-read/',      MarkAllReadView.as_view(),           name='mark-all-read'),
    path('unread-count/',       UnreadCountView.as_view(),           name='unread-count'),
    path('preferences/',        NotificationPreferenceView.as_view(),name='notification-preferences'),
]
