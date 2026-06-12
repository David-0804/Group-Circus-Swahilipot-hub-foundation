"""Nexus News — URL Configuration"""
from django.urls import path
from .models import NewsStoryListView, NewsStoryReviewView, RadioScheduleView, SubmitShowPlanView, SubscriptionListView, RequestSeatView, AllocateSeatView
from .category_views import NewsCategoryView, RadioFrequencyView, RadioShowView, RadioMyScheduleView, SeatRequestListView

urlpatterns = [
    # News CMS
    path('',                    NewsStoryListView.as_view(),    name='news-list'),
    path('<uuid:pk>/review/',   NewsStoryReviewView.as_view(),  name='news-review'),
    path('categories/',         NewsCategoryView.as_view(),     name='news-categories'),
    path('published/',          NewsStoryListView.as_view(),    name='news-published'),  # filter in view

    # Radio
    path('schedule/',           RadioScheduleView.as_view(),    name='radio-schedule'),
    path('schedule/<uuid:pk>/show-plan/', SubmitShowPlanView.as_view(), name='radio-show-plan'),
    path('frequencies/',        RadioFrequencyView.as_view(),   name='radio-frequencies'),
    path('shows/',              RadioShowView.as_view(),        name='radio-shows'),
    path('my-schedule/',        RadioMyScheduleView.as_view(),  name='radio-my-schedule'),

    # Software subscriptions
    path('subscriptions/',      SubscriptionListView.as_view(), name='subscription-list'),
    path('subscriptions/<uuid:subscription_id>/request/', RequestSeatView.as_view(), name='request-seat'),
    path('subscriptions/seat-requests/',             SeatRequestListView.as_view(),   name='seat-requests'),
    path('subscriptions/seat-requests/<uuid:request_id>/allocate/', AllocateSeatView.as_view(), name='allocate-seat'),
]
