from django.urls import path
from . import views
urlpatterns = [
    path('categories/', views.CategoryListCreate.as_view()),
    path('items/', views.ItemListCreate.as_view()),
    path('items/<int:pk>/', views.ItemDetail.as_view()),
    path('requests/', views.RequestListCreate.as_view()),
    path('requests/<int:pk>/', views.RequestDetail.as_view()),
    path('requests/<int:pk>/approve/', views.approve_request),
    path('requests/<int:pk>/reject/', views.reject_request),
    path('requests/<int:pk>/return/', views.confirm_return),
    path('maintenance/', views.MaintenanceListCreate.as_view()),
    path('maintenance/<int:pk>/', views.MaintenanceDetail.as_view()),
]
