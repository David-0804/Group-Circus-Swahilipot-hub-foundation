from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from accounts.permissions import IsAdminOrStaff
from .models import NewsCategory, NewsStory, EditorialReview
from .serializers import CategorySerializer, StorySerializer, StoryPublicSerializer, ReviewSerializer

class CategoryList(generics.ListCreateAPIView):
    queryset = NewsCategory.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    def get_permissions(self):
        if self.request.method == 'GET': return [AllowAny()]
        return [IsAdminOrStaff()]

class PublicFeedView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = StoryPublicSerializer
    def get_queryset(self):
        qs = NewsStory.objects.filter(status='published').select_related('journalist','category')
        cat = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        if cat: qs = qs.filter(category__slug=cat)
        if search: qs = qs.filter(title__icontains=search)
        return qs.order_by('-published_at')

class StoryListCreate(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = StorySerializer
    def get_queryset(self):
        user = self.request.user
        qs = NewsStory.objects.select_related('journalist','category').prefetch_related('reviews')
        if user.role == 'student': return qs.filter(journalist=user)
        stat = self.request.query_params.get('status')
        cat = self.request.query_params.get('category')
        if stat: qs = qs.filter(status=stat)
        if cat: qs = qs.filter(category_id=cat)
        return qs.order_by('-created_at')
    def perform_create(self, s): s.save(journalist=self.request.user)

class StoryDetail(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = NewsStory.objects.prefetch_related('reviews')
    serializer_class = StorySerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_story(request, pk):
    story = NewsStory.objects.get(pk=pk)
    story.status = 'submitted'
    story.submitted_at = timezone.now()
    story.save()
    return Response({'message': 'Submitted for review'})

@api_view(['POST'])
@permission_classes([IsAdminOrStaff])
def review_story(request, pk):
    story = NewsStory.objects.get(pk=pk)
    action = request.data.get('action')
    review = EditorialReview.objects.create(
        story=story, reviewer=request.user,
        action=action, comment=request.data.get('comment',''))
    status_map = {
        'approved': 'approved', 'changes_requested': 'changes_requested',
        'rejected': 'rejected', 'published': 'published', 'archived': 'archived'
    }
    story.status = status_map.get(action, story.status)
    if action == 'published': story.published_at = timezone.now()
    story.save()
    return Response(ReviewSerializer(review).data, status=201)
