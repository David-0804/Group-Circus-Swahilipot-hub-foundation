from django.urls import path
from . import views
urlpatterns = [
    path('courses/', views.CourseList.as_view()),
    path('', views.ProjectListCreate.as_view()),
    path('<int:pk>/', views.ProjectDetail.as_view()),
    path('<int:pk>/submit/', views.submit_project),
    path('submissions/<int:pk>/review/', views.review_submission),
]
