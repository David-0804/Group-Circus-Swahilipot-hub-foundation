"""Nexus Notifications — URLs"""
from django.urls import path
from .models import (
    NotificationListView, NotificationDetailView,
<<<<<<< HEAD
    MarkReadView, MarkAllReadView, UnreadCountView, NotificationPreferenceView,
=======
    MarkAllReadView, UnreadCountView, NotificationPreferenceView,
>>>>>>> origin/main
)

urlpatterns = [
    path('',                    NotificationListView.as_view(),      name='notification-list'),
    path('<uuid:pk>/',          NotificationDetailView.as_view(),    name='notification-detail'),
<<<<<<< HEAD
    path('<uuid:pk>/mark-read/', MarkReadView.as_view(),             name='mark-read'),
=======
>>>>>>> origin/main
    path('mark-all-read/',      MarkAllReadView.as_view(),           name='mark-all-read'),
    path('unread-count/',       UnreadCountView.as_view(),           name='unread-count'),
    path('preferences/',        NotificationPreferenceView.as_view(),name='notification-preferences'),
]
