"""Nexus Accounts — URL Configuration"""
from django.urls import path
from .views import UserProfileView, UserListView, UserDetailView, UserPreferencesView
from apps.accounts.org_views import (
    OrganisationView, BranchListView, BranchDetailView,
    DepartmentListView, DepartmentDetailView,
    UserStatsView, BulkImportView, ChangePasswordView,
    MFASetupView, MFADisableView, AuditLogView,
    UserSessionListView, RevokeSessionView,
)

urlpatterns = [
    # Profile
    path('profile/',            UserProfileView.as_view(),       name='user-profile'),
    path('profile/password/',   ChangePasswordView.as_view(),    name='change-password'),

    # ── Accessibility & notification preferences (synced across devices) ──
    path('preferences/',        UserPreferencesView.as_view(),   name='user-preferences'),

    # MFA
    path('mfa/setup/',          MFASetupView.as_view(),          name='mfa-setup'),
    path('mfa/disable/',        MFADisableView.as_view(),        name='mfa-disable'),

    # Sessions
    path('sessions/',           UserSessionListView.as_view(),   name='user-sessions'),
    path('sessions/<uuid:pk>/revoke/', RevokeSessionView.as_view(), name='revoke-session'),

    # Users (admin)
    path('users/',              UserListView.as_view(),          name='user-list'),
    path('users/<uuid:pk>/',    UserDetailView.as_view(),        name='user-detail'),
    path('users/bulk-import/',  BulkImportView.as_view(),        name='user-bulk-import'),
    path('users/stats/',        UserStatsView.as_view(),         name='user-stats'),

    # Organisation
    path('organisation/',       OrganisationView.as_view(),      name='organisation'),

    # Branches
    path('branches/',           BranchListView.as_view(),        name='branch-list'),
    path('branches/<uuid:pk>/', BranchDetailView.as_view(),      name='branch-detail'),

    # Departments
    path('departments/',        DepartmentListView.as_view(),    name='department-list'),
    path('departments/<uuid:pk>/', DepartmentDetailView.as_view(), name='department-detail'),

    # Audit log
    path('audit-log/',          AuditLogView.as_view(),          name='audit-log'),
]