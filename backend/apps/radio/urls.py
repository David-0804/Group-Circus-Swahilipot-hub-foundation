"""Nexus Radio — URL Configuration"""
from django.urls import path
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated


class RadioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, **kwargs):
        return Response({'module': 'radio', 'status': 'active', 'results': []})

    def post(self, request, **kwargs):
        return Response({'module': 'radio', 'status': 'created'}, status=201)

    def patch(self, request, **kwargs):
        return Response({'module': 'radio', 'status': 'updated'})

    def delete(self, request, **kwargs):
        return Response(status=204)


urlpatterns = [
    path('',                      RadioView.as_view(), name='radio-list'),
    path('schedule/',             RadioView.as_view(), name='radio-schedule'),
    path('schedule/<uuid:pk>/',   RadioView.as_view(), name='radio-slot-detail'),
    path('frequencies/',          RadioView.as_view(), name='radio-frequencies'),
    path('shows/',                RadioView.as_view(), name='radio-shows'),
    path('my-schedule/',          RadioView.as_view(), name='radio-my-schedule'),
    path('<uuid:pk>/',            RadioView.as_view(), name='radio-detail'),
]