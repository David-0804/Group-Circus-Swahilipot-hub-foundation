"""Nexus Equipment — URL Configuration"""
from django.urls import path
from .models import (
    EquipmentInventoryView, EquipmentDetailView,
    CheckoutRequestListView, ApproveCheckoutView, ReturnEquipmentView,
    MaintenanceLogView, EquipmentStatsView,
)
from .category_views import EquipmentCategoryView

urlpatterns = [
    path('',                              EquipmentInventoryView.as_view(),    name='equipment-list'),
    path('stats/',                        EquipmentStatsView.as_view(),        name='equipment-stats'),
    path('categories/',                   EquipmentCategoryView.as_view(),     name='equipment-categories'),
    path('<uuid:pk>/',                    EquipmentDetailView.as_view(),       name='equipment-detail'),
    path('checkout-requests/',            CheckoutRequestListView.as_view(),   name='checkout-list'),
    path('checkout-requests/<uuid:pk>/approve/', ApproveCheckoutView.as_view(), name='checkout-approve'),
    path('checkout-requests/<uuid:pk>/return/',  ReturnEquipmentView.as_view(),  name='checkout-return'),
    path('maintenance/',                  MaintenanceLogView.as_view(),        name='maintenance-list'),
]
