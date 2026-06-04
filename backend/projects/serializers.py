from rest_framework import serializers
from .models import Course, Project, Submission, Review

class CourseSerializer(serializers.ModelSerializer):
    lecturer_name = serializers.CharField(source='lecturer.full_name', read_only=True)
    class Meta:
        model = Course
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.full_name', read_only=True)
    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ['reviewer','reviewed_at']

class SubmissionSerializer(serializers.ModelSerializer):
    reviews = ReviewSerializer(many=True, read_only=True)
    class Meta:
        model = Submission
        fields = '__all__'
        read_only_fields = ['version_number','submitted_at','is_late','file_name','file_size']

class ProjectSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    submissions = SubmissionSerializer(many=True, read_only=True)
    latest_status = serializers.SerializerMethodField()
    def get_latest_status(self, obj):
        sub = obj.submissions.first()
        return sub.status if sub else None
    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['student']
