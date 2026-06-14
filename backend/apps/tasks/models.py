"""Nexus Internship Core — Tasks, Logbooks, Evaluations, Certificates"""
from django.db import models
from django.utils import timezone
from rest_framework import serializers, generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from core.models import TimeStampedModel, AuditedModel


# ═══════════════════════════════════════════════════════════════
# TASKS
# ═══════════════════════════════════════════════════════════════

class Task(TimeStampedModel):
    PRIORITY = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('urgent', 'Urgent')]
    STATUS = [
        ('pending', 'Pending'), ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'), ('reviewed', 'Reviewed'),
        ('approved', 'Approved'), ('rejected', 'Rejected'), ('overdue', 'Overdue'),
    ]

    title              = models.CharField(max_length=300)
    description        = models.TextField()
    assigned_to        = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='assigned_tasks')
    assigned_by        = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='created_tasks')
    organisation       = models.ForeignKey('accounts.Organisation', on_delete=models.CASCADE)
    department         = models.ForeignKey('accounts.Department', on_delete=models.SET_NULL, null=True, blank=True)
    priority           = models.CharField(max_length=10, choices=PRIORITY, default='medium')
    status             = models.CharField(max_length=20, choices=STATUS, default='pending')
    due_date           = models.DateTimeField()
    extended_due_date  = models.DateTimeField(null=True, blank=True)
    progress_percent   = models.IntegerField(default=0)
    attachments        = models.FileField(upload_to='tasks/attachments/', null=True, blank=True)
    submission_notes   = models.TextField(blank=True)
    submission_file    = models.FileField(upload_to='tasks/submissions/', null=True, blank=True)
    submitted_at       = models.DateTimeField(null=True, blank=True)
    supervisor_feedback = models.TextField(blank=True)
    reviewed_at        = models.DateTimeField(null=True, blank=True)
    overdue_alert_sent = models.BooleanField(default=False)
    tags               = models.JSONField(default=list)

    class Meta:  # type: ignore
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['due_date', 'status']),
        ]

    def __str__(self):
        return f"{self.title} → {self.assigned_to.full_name}"

    def is_overdue(self):
        effective_due = self.extended_due_date or self.due_date
        return self.status not in ('approved', 'rejected') and effective_due < timezone.now()


class DeadlineExtensionRequest(TimeStampedModel):
    STATUS = [('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')]
    task                    = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='extension_requests')
    requested_by            = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    reason                  = models.TextField()
    requested_extension_date = models.DateTimeField()
    status                  = models.CharField(max_length=20, choices=STATUS, default='pending')
    reviewed_by             = models.ForeignKey('accounts.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='extension_reviews')
    review_notes            = models.TextField(blank=True)


# ═══════════════════════════════════════════════════════════════
# LOGBOOKS
# ═══════════════════════════════════════════════════════════════

class Logbook(TimeStampedModel):
    """One logbook per attachee per attachment period"""
    attachee       = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='logbooks')
    organisation   = models.ForeignKey('accounts.Organisation', on_delete=models.CASCADE)
    title          = models.CharField(max_length=200, default='Industrial Attachment Logbook')
    start_date     = models.DateField()
    end_date       = models.DateField()
    is_active      = models.BooleanField(default=True)
    final_submitted    = models.BooleanField(default=False)
    final_submitted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.attachee.full_name} — Logbook"


class LogbookEntry(TimeStampedModel):
    STATUS = [
        ('draft', 'Draft'), ('submitted', 'Submitted'),
        ('approved', 'Approved'), ('rejected', 'Rejected'),
    ]
    logbook               = models.ForeignKey(Logbook, on_delete=models.CASCADE, related_name='entries')
    date                  = models.DateField()
    activities            = models.TextField()
    skills_acquired       = models.TextField(blank=True)
    challenges            = models.TextField(blank=True)
    reflection            = models.TextField(blank=True)
    status                = models.CharField(max_length=20, choices=STATUS, default='draft')
    supervisor_comments   = models.TextField(blank=True)
    supervisor_signature  = models.CharField(max_length=200, blank=True)
    reviewed_by           = models.ForeignKey('accounts.User', null=True, blank=True, on_delete=models.SET_NULL)
    reviewed_at           = models.DateTimeField(null=True, blank=True)
    attachments           = models.FileField(upload_to='logbooks/attachments/', null=True, blank=True)

    class Meta:  # type: ignore
        unique_together = [['logbook', 'date']]
        ordering = ['-date']


# ═══════════════════════════════════════════════════════════════
# EVALUATIONS
# ═══════════════════════════════════════════════════════════════

class EvaluationTemplate(TimeStampedModel):
    TYPES = [('weekly', 'Weekly'), ('monthly', 'Monthly'), ('final', 'Final'), ('mid_term', 'Mid-Term')]
    organisation    = models.ForeignKey('accounts.Organisation', on_delete=models.CASCADE)
    name            = models.CharField(max_length=200)
    evaluation_type = models.CharField(max_length=20, choices=TYPES)
    criteria        = models.JSONField(default=list, help_text='List of {criterion, max_score, weight} objects')
    is_active       = models.BooleanField(default=True)


class Evaluation(TimeStampedModel):
    STATUS = [('pending', 'Pending'), ('in_progress', 'In Progress'), ('completed', 'Completed')]
    template             = models.ForeignKey(EvaluationTemplate, on_delete=models.CASCADE)
    attachee             = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='evaluations_received')
    evaluator            = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='evaluations_given')
    organisation         = models.ForeignKey('accounts.Organisation', on_delete=models.CASCADE)
    period_start         = models.DateField()
    period_end           = models.DateField()
    scores               = models.JSONField(default=dict)
    total_score          = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    max_possible_score   = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    percentage           = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    overall_feedback     = models.TextField(blank=True)
    strengths            = models.TextField(blank=True)
    areas_for_improvement = models.TextField(blank=True)
    recommendation       = models.CharField(max_length=100, blank=True)
    status               = models.CharField(max_length=20, choices=STATUS, default='pending')
    completed_at         = models.DateTimeField(null=True, blank=True)
    attachee_acknowledged = models.BooleanField(default=False)
    attachee_comments    = models.TextField(blank=True)

    class Meta:  # type: ignore
        ordering = ['-created_at']


# ═══════════════════════════════════════════════════════════════
# CERTIFICATES & RECOMMENDATION LETTERS
# ═══════════════════════════════════════════════════════════════

class Certificate(TimeStampedModel):
    TYPES = [
        ('completion',     'Certificate of Completion'),
        ('recommendation', 'Recommendation Letter'),
        ('achievement',    'Achievement Award'),
        ('participation',  'Participation Certificate'),
    ]
    STATUS = [('pending', 'Pending'), ('generated', 'Generated'), ('issued', 'Issued'), ('revoked', 'Revoked')]

    recipient          = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='certificates')
    organisation       = models.ForeignKey('accounts.Organisation', on_delete=models.CASCADE)
    certificate_type   = models.CharField(max_length=30, choices=TYPES)
    certificate_number = models.CharField(max_length=50, unique=True)
    issue_date         = models.DateField(null=True, blank=True)
    valid_until        = models.DateField(null=True, blank=True)
    status             = models.CharField(max_length=20, choices=STATUS, default='pending')
    template_data      = models.JSONField(default=dict)
    pdf_file           = models.FileField(upload_to='certificates/', null=True, blank=True)
    issued_by          = models.ForeignKey('accounts.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='issued_certificates')
    signed_by_name     = models.CharField(max_length=200, blank=True)
    signed_by_title    = models.CharField(max_length=200, blank=True)
    qr_verification_code = models.CharField(max_length=100, unique=True)
    verification_url   = models.URLField(blank=True)

    class Meta:  # type: ignore
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_certificate_type_display()} — {self.recipient.full_name}"

    def save(self, *args, **kwargs):
        import uuid
        if not self.certificate_number:
            self.certificate_number = f"Nexus-{timezone.now().year}-{str(uuid.uuid4())[:8].upper()}"
        if not self.qr_verification_code:
            self.qr_verification_code = str(uuid.uuid4())
        super().save(*args, **kwargs)


class AchievementBadge(TimeStampedModel):
    BADGE_TYPES = [
        ('punctuality',   'Perfect Punctuality'),
        ('task_master',   'Task Master'),
        ('fast_learner',  'Fast Learner'),
        ('team_player',   'Team Player'),
        ('innovator',     'Innovator'),
        ('communicator',  'Outstanding Communicator'),
        ('milestone',     'Milestone Achievement'),
        ('completion',    'Attachment Completion'),
    ]
    user         = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='badges')
    badge_type   = models.CharField(max_length=30, choices=BADGE_TYPES)
    awarded_by   = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='awarded_badges')
    organisation = models.ForeignKey('accounts.Organisation', on_delete=models.CASCADE)
    reason       = models.TextField(blank=True)
    awarded_at   = models.DateTimeField(auto_now_add=True)

    class Meta:  # type: ignore
        ordering = ['-awarded_at']


# ─── SERIALIZERS ─────────────────────────────────────────────────────────────

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.full_name', read_only=True)
    is_overdue       = serializers.SerializerMethodField()

    class Meta:  # type: ignore
        model  = Task
        fields = '__all__'
        read_only_fields = ['assigned_by', 'organisation']

    def get_is_overdue(self, obj):
        return obj.is_overdue()


class LogbookEntrySerializer(serializers.ModelSerializer):
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True)

    class Meta:  # type: ignore
        model  = LogbookEntry
        fields = '__all__'


class EvaluationSerializer(serializers.ModelSerializer):
    attachee_name  = serializers.CharField(source='attachee.full_name',  read_only=True)
    evaluator_name = serializers.CharField(source='evaluator.full_name', read_only=True)

    class Meta:  # type: ignore
        model  = Evaluation
        fields = '__all__'


class CertificateSerializer(serializers.ModelSerializer):
    recipient_name = serializers.CharField(source='recipient.full_name', read_only=True)

    class Meta:  # type: ignore
        model  = Certificate
        fields = '__all__'


# ─── VIEWS ───────────────────────────────────────────────────────────────────

class TaskListView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer

    def get_queryset(self):
        user = self.request.user
        qs   = Task.objects.filter(organisation=user.organisation).select_related('assigned_to', 'assigned_by')
        if user.role == 'attachee':
            return qs.filter(assigned_to=user)
        if user.role == 'supervisor':
            return qs.filter(assigned_by=user)
        return qs

    def perform_create(self, serializer):
        task = serializer.save(
            assigned_by  = self.request.user,
            organisation = self.request.user.organisation,
        )
        try:
            from apps.notifications.services import NotificationService
            NotificationService.notify_user(
                task.assigned_to,
                f"New Task: {task.title}",
                f"You have been assigned a new task due {task.due_date.strftime('%Y-%m-%d')}.",
                'task_assigned',
            )
        except Exception:
            pass


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer

    def get_queryset(self):
        user = self.request.user
        qs   = Task.objects.filter(organisation=user.organisation).select_related('assigned_to', 'assigned_by')
        # Attachees can only see/update their own tasks
        if user.role == 'attachee':
            return qs.filter(assigned_to=user)
        return qs

    def perform_update(self, serializer):
        task        = self.get_object()
        new_status  = self.request.data.get('status')
        user        = self.request.user

        # Attachee starting a task
        if new_status == 'in_progress' and task.status == 'pending' and user.role == 'attachee':
            serializer.save(status='in_progress')
            return

        serializer.save()


class TaskSubmitView(APIView):
    def post(self, request, pk):
        try:
            task = Task.objects.get(pk=pk, assigned_to=request.user)
        except Task.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)

        if task.status not in ('pending', 'in_progress'):
            return Response({'detail': f'Cannot submit a task with status: {task.status}'}, status=400)

        task.status           = 'submitted'
        task.submission_notes = request.data.get('notes', '')
        task.submitted_at     = timezone.now()
        if 'file' in request.FILES:
            task.submission_file = request.FILES['file']
        task.save()

        try:
            from apps.notifications.services import NotificationService
            NotificationService.notify_user(
                task.assigned_by,
                f"Task Submitted: {task.title}",
                f"{task.assigned_to.full_name} has submitted the task for review.",
                'task_submitted',
            )
        except Exception:
            pass

        return Response(TaskSerializer(task).data)


class TaskReviewView(APIView):
    def post(self, request, pk):
        try:
            task = Task.objects.get(pk=pk, organisation=request.user.organisation)
        except Task.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)

        action   = request.data.get('action')
        feedback = request.data.get('feedback', '')

        if action == 'approve':
            task.status = 'approved'
        elif action == 'reject':
            task.status = 'rejected'
        else:
            return Response({'detail': 'action must be approve or reject'}, status=400)

        task.supervisor_feedback = feedback
        task.reviewed_at         = timezone.now()
        task.save()

        try:
            from apps.notifications.services import NotificationService
            NotificationService.notify_user(
                task.assigned_to,
                f"Task {action.title()}d: {task.title}",
                feedback or f"Your task has been {action}d.",
                'task_reviewed',
            )
        except Exception:
            pass

        return Response(TaskSerializer(task).data)


class LogbookEntryListView(generics.ListCreateAPIView):
    serializer_class = LogbookEntrySerializer

    def get_queryset(self):
        user       = self.request.user
        logbook_id = self.kwargs.get('logbook_id')
        return LogbookEntry.objects.filter(
            logbook_id           = logbook_id,
            logbook__organisation = user.organisation,
        )

    def perform_create(self, serializer):
        serializer.save(logbook_id=self.kwargs['logbook_id'])


class CertificateGenerateView(APIView):
    def post(self, request):
        attachee_id = request.data.get('attachee_id')
        cert_type   = request.data.get('certificate_type', 'completion')

        try:
            from apps.accounts.models import User
            attachee = User.objects.get(id=attachee_id, organisation=request.user.organisation)
        except Exception:
            return Response({'detail': 'Attachee not found'}, status=404)

        cert = Certificate.objects.create(
            recipient        = attachee,
            organisation     = request.user.organisation,
            certificate_type = cert_type,
            issued_by        = request.user,
            issue_date       = timezone.now().date(),
            signed_by_name   = request.data.get('signed_by_name', request.user.full_name),
            signed_by_title  = request.data.get('signed_by_title', request.user.get_role_display()),
            status           = 'generated',
            template_data    = {
                'attachee_name': attachee.full_name,
                'organisation':  request.user.organisation.name,
                'department':    attachee.department.name if attachee.department else '',
                'issue_date':    timezone.now().date().isoformat(),
                'signed_by':     request.data.get('signed_by_name', ''),
            },
        )

        try:
            from apps.notifications.services import NotificationService
            NotificationService.notify_user(
                attachee,
                f"Your {cert.get_certificate_type_display()} is Ready",
                "Your certificate has been generated. You can download it from your portal.",
                'certificate_issued',
            )
        except Exception:
            pass

        return Response(CertificateSerializer(cert).data, status=201)