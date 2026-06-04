from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('login/', views.CustomTokenObtainPairView.as_view()),
    path('logout/', views.LogoutView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),
    path('profile/', views.ProfileView.as_view()),
    path('change-password/', views.ChangePasswordView.as_view()),
    path('users/', views.UserListCreateView.as_view()),
    path('users/<int:pk>/', views.UserDetailView.as_view()),
    path('audit-log/', views.AuditLogView.as_view()),
    path('dashboard/', views.DashboardStatsView.as_view()),
]
