from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdminOrStaff
from .models import Course, Project, Submission, Review
from .serializers import CourseSerializer, ProjectSerializer, SubmissionSerializer, ReviewSerializer

class CourseList(generics.ListCreateAPIView):
    serializer_class = CourseSerializer
    def get_permissions(self):
        if self.request.method == 'POST': return [IsAdminOrStaff()]
        return [IsAuthenticated()]
    def get_queryset(self):
        user = self.request.user
        if user.role == 'student': return Course.objects.filter(is_active=True)
        if user.role == 'staff': return Course.objects.filter(lecturer=user)
        return Course.objects.all()

class ProjectListCreate(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProjectSerializer
    def get_queryset(self):
        user = self.request.user
        if user.role == 'student': return Project.objects.filter(student=user)
        course_id = self.request.query_params.get('course')
        qs = Project.objects.select_related('student','course').prefetch_related('submissions')
        if course_id: qs = qs.filter(course_id=course_id)
        return qs.order_by('-created_at')
    def perform_create(self, s): s.save(student=self.request.user)

class ProjectDetail(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Project.objects.prefetch_related('submissions__reviews')
    serializer_class = ProjectSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_project(request, pk):
    project = Project.objects.get(pk=pk)
    file = request.FILES.get('file')
    if not file:
        return Response({'error': 'File required'}, status=400)
    sub = Submission.objects.create(
        project=project, file=file,
        file_name=file.name, file_size=file.size)
    return Response(SubmissionSerializer(sub).data, status=201)

@api_view(['POST'])
@permission_classes([IsAdminOrStaff])
def review_submission(request, pk):
    sub = Submission.objects.get(pk=pk)
    review = Review.objects.create(
        submission=sub, reviewer=request.user,
        feedback_text=request.data.get('feedback_text',''),
        grade=request.data.get('grade',''))
    sub.status = request.data.get('status', 'feedback_given')
    sub.save()
    return Response(ReviewSerializer(review).data, status=201)
