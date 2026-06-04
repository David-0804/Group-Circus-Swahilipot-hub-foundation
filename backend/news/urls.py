from django.urls import path
from . import views
urlpatterns = [
    path('categories/', views.CategoryList.as_view()),
    path('feed/', views.PublicFeedView.as_view()),
    path('stories/', views.StoryListCreate.as_view()),
    path('stories/<int:pk>/', views.StoryDetail.as_view()),
    path('stories/<int:pk>/submit/', views.submit_story),
    path('stories/<int:pk>/review/', views.review_story),
]
