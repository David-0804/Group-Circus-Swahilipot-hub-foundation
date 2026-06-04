from django.urls import path
from . import views
urlpatterns = [
    path('frequencies/', views.FrequencyList.as_view()),
    path('status/', views.CurrentStatusView.as_view()),
    path('report-down/', views.report_down),
    path('report-up/', views.report_up),
    path('outages/', views.OutageLogView.as_view()),
    path('schedule/', views.ScheduleListCreate.as_view()),
    path('schedule/<int:pk>/', views.ScheduleDetail.as_view()),
    path('schedule/<int:pk>/show-plan/', views.submit_show_plan),
    path('calls/', views.CallListCreate.as_view()),
]
