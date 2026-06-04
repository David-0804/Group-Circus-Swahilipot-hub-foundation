from django.urls import path
from . import views
urlpatterns = [
    path('locations/', views.LocationList.as_view()),
    path('bookings/', views.BookingListCreate.as_view()),
    path('bookings/<int:pk>/', views.BookingDetail.as_view()),
    path('bookings/<int:pk>/approve/', views.approve_booking),
    path('bookings/<int:pk>/decline/', views.decline_booking),
    path('bookings/<int:pk>/upload-footage/', views.upload_footage),
    path('footage/', views.FootageArchive.as_view()),
]
