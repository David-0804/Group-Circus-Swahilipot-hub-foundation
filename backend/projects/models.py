from django.db import models
from django.conf import settings

class Course(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    department = models.CharField(max_length=100)
    lecturer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='courses')
    is_active = models.BooleanField(default=True)
    def __str__(self): return f'{self.code} - {self.name}'

class Project(models.Model):
    TYPES = [('individual','Individual'),('group','Group')]
    title = models.CharField(max_length=300)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='projects')
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    description = models.TextField(blank=True)
    submission_type = models.CharField(max_length=20, choices=TYPES, default='individual')
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.title

class Submission(models.Model):
    STATUS = [('submitted','Submitted'),('under_review','Under Review'),
              ('feedback_given','Feedback Given'),('graded','Graded'),
              ('resubmit_requested','Resubmit Requested')]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='submissions')
    version_number = models.PositiveIntegerField(default=1)
    file = models.FileField(upload_to='submissions/%Y/%m/')
    file_name = models.CharField(max_length=300)
    file_size = models.BigIntegerField(default=0)
    submitted_at = models.DateTimeField(auto_now_add=True)
    is_late = models.BooleanField(default=False)
    status = models.CharField(max_length=30, choices=STATUS, default='submitted')
    def save(self, *args, **kwargs):
        if not self.pk:
            count = Submission.objects.filter(project=self.project).count()
            self.version_number = count + 1
        super().save(*args, **kwargs)
    class Meta:
        ordering = ['-submitted_at']

class Review(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    feedback_text = models.TextField()
    grade = models.CharField(max_length=20, blank=True)
    reviewed_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return f'Review of {self.submission}'
