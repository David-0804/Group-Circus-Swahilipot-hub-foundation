from django.urls import path
<<<<<<< HEAD
from .views import (
    WifiGrantListCreateView,
    WifiGrantDetailView,
    WifiGrantApproveView,
    WifiGrantRevokeView,
    WifiActiveGrantsView,
)

urlpatterns = [
    path('',                   WifiGrantListCreateView.as_view()),
    path('active/',            WifiActiveGrantsView.as_view()),
    path('<uuid:pk>/',         WifiGrantDetailView.as_view()),
    path('<uuid:pk>/approve/', WifiGrantApproveView.as_view()),
    path('<uuid:pk>/revoke/',  WifiGrantRevokeView.as_view()),
]
=======
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

class ModuleView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, **kwargs):
        return Response({'status': 'active'})
    def post(self, request, **kwargs):
        return Response({'status': 'created'}, status=201)
    def patch(self, request, **kwargs):
        return Response({'status': 'updated'})
    def delete(self, request, **kwargs):
        return Response(status=204)

urlpatterns = [
    path('', ModuleView.as_view()),
    path('<uuid:pk>/', ModuleView.as_view()),
]
>>>>>>> origin/main
