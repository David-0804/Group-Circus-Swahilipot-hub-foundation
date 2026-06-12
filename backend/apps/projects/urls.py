"""Nexus Projects — URL Configuration"""
from django.urls import path
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated


class ProjectListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'module': 'projects', 'status': 'active', 'results': []})

    def post(self, request):
        return Response({'module': 'projects', 'status': 'created'}, status=201)


class ProjectDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        return Response({'module': 'projects', 'id': str(pk)})

    def patch(self, request, pk):
        return Response({'module': 'projects', 'id': str(pk), 'status': 'updated'})

    def delete(self, request, pk):
        return Response(status=204)


urlpatterns = [
    path('',           ProjectListView.as_view(),  name='project-list'),
    path('<uuid:pk>/', ProjectDetailView.as_view(), name='project-detail'),
]