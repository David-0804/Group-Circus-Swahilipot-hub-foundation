from django.urls import path
from .models import TaskListView, TaskDetailView, TaskSubmitView, TaskReviewView

urlpatterns = [
    path('',                      TaskListView.as_view()),
    path('<uuid:pk>/',            TaskDetailView.as_view()),
    path('<uuid:pk>/submit/',     TaskSubmitView.as_view()),
    path('<uuid:pk>/review/',     TaskReviewView.as_view()),
]       