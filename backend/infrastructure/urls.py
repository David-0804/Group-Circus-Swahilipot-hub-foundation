from django.urls import path
from . import views
urlpatterns = [
    path('wifi/', views.WifiRequestList.as_view()),
    path('wifi/<int:pk>/approve/', views.approve_wifi),
    path('wifi/<int:pk>/deny/', views.deny_wifi),
    path('software/', views.SoftwareList.as_view()),
    path('licences/', views.LicenceList.as_view()),
    path('access-requests/', views.AccessRequestList.as_view()),
    path('access-requests/<int:pk>/approve/', views.approve_access),
    path('transfer/upload/', views.TransferUploadView.as_view()),
    path('transfer/<uuid:token>/', views.get_transfer),
    path('transfer/my-uploads/', views.MyTransfersView.as_view()),
    path('feedback/categories/', views.FeedbackCategoryList.as_view()),
    path('feedback/tickets/', views.TicketListCreate.as_view()),
    path('feedback/tickets/<int:pk>/', views.TicketDetail.as_view()),
    path('feedback/tickets/<int:pk>/respond/', views.respond_to_ticket),
]
