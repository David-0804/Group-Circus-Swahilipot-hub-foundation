<<<<<<< HEAD
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EvaluationTemplateViewSet, EvaluationViewSet

router = DefaultRouter()
router.register(r"templates", EvaluationTemplateViewSet, basename="evaluation-template")
router.register(r"", EvaluationViewSet, basename="evaluation")

urlpatterns = [
    path("", include(router.urls)),
]
=======
from django.urls import path
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
