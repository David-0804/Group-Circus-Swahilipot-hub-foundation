from django.urls import path
from .views import (
    TodayAttendanceView,
    CheckInView,
    CheckOutView,
    AttendanceHistoryView,
    LeaveRequestListCreateView,
    LeaveRequestDetailView,
)

urlpatterns = [
    path('check-in/',        CheckInView.as_view(),              name='attendance-check-in'),
    path('check-out/',       CheckOutView.as_view(),             name='attendance-check-out'),
    path('today/',           TodayAttendanceView.as_view(),      name='attendance-today'),
    path('history/',         AttendanceHistoryView.as_view(),    name='attendance-history'),
    path('leave/',           LeaveRequestListCreateView.as_view(), name='attendance-leave-list'),
    path('leave/<uuid:pk>/', LeaveRequestDetailView.as_view(),   name='attendance-leave-detail'),
]