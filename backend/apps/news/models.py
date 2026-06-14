"""Nexus Broadcast — News CMS, Radio Schedule, Software Subscriptions"""
from django.db import models
from django.utils import timezone
from rest_framework import serializers, generics, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from core.models import TimeStampedModel


# ═══════════════════════════════════════════════════════════════
# NEWS CMS
# ═══════════════════════════════════════════════════════════════

class NewsCategory(TimeStampedModel):
    organisation = models.ForeignKey('accounts.Organisation', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    colour = models.CharField(max_length=7, default='#0EA5E9')
    broadcast_deadline_hour = models.IntegerField(default=17, help_text='Hour of day (0-23) when stories are due')

    def __str__(self): return self.name


class NewsStory(TimeStampedModel):
    STATUS_CHOICES = [
        ('draft', 'Draft'), ('submitted', 'Submitted for Review'),
        ('under_review', 'Under Review'), ('changes_requested', 'Changes Requested'),
        ('approved', 'Approved'), ('published', 'Published'),
        ('rejected', 'Rejected'), ('archived', 'Archived'),
    ]

    organisation = models.ForeignKey('accounts.Organisation', on_delete=models.CASCADE, related_name='news_stories')
    author = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='authored_stories')
    editor = models.ForeignKey('accounts.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='edited_stories')
    category = models.ForeignKey(NewsCategory, on_delete=models.SET_NULL, null=True, related_name='stories')
    title = models.CharField(max_length=300)
    subtitle = models.CharField(max_length=300, blank=True)
    body = models.TextField()
    tags = models.JSONField(default=list)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='draft')
    published_at = models.DateTimeField(null=True, blank=True)
    submission_deadline = models.DateTimeField(null=True, blank=True)
    featured_image = models.ImageField(upload_to='news/images/', null=True, blank=True)
    is_breaking = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    view_count = models.IntegerField(default=0)
    word_count = models.IntegerField(default=0)

<<<<<<< HEAD
    class Meta:  # type: ignore
=======
    class Meta:
>>>>>>> origin/main
        ordering = ['-created_at']
        indexes = [models.Index(fields=['status', 'organisation']), models.Index(fields=['published_at'])]

    def __str__(self): return self.title

    def save(self, *args, **kwargs):
        self.word_count = len(self.body.split())
        super().save(*args, **kwargs)


class NewsStoryVersion(TimeStampedModel):
    """Version history for news stories"""
    story = models.ForeignKey(NewsStory, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField()
    title = models.CharField(max_length=300)
    body = models.TextField()
    edited_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    change_summary = models.TextField(blank=True)


class EditorialComment(TimeStampedModel):
    story = models.ForeignKey(NewsStory, on_delete=models.CASCADE, related_name='editorial_comments')
    author = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    comment = models.TextField()
    is_resolved = models.BooleanField(default=False)

<<<<<<< HEAD
    class Meta:  # type: ignore
=======
    class Meta:
>>>>>>> origin/main
        ordering = ['created_at']


# ═══════════════════════════════════════════════════════════════
# RADIO SCHEDULE
# ═══════════════════════════════════════════════════════════════

class RadioFrequency(TimeStampedModel):
    organisation = models.ForeignKey('accounts.Organisation', on_delete=models.CASCADE, related_name='radio_frequencies')
    name = models.CharField(max_length=100)
    frequency_mhz = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self): return f"{self.name} ({self.frequency_mhz} MHz)"


class RadioShow(TimeStampedModel):
    SHOW_TYPES = [
        ('news', 'News'), ('music', 'Music'), ('talk', 'Talk'),
        ('sport', 'Sport'), ('drama', 'Drama'), ('education', 'Education'),
        ('religious', 'Religious'), ('entertainment', 'Entertainment'), ('other', 'Other'),
    ]
    organisation = models.ForeignKey('accounts.Organisation', on_delete=models.CASCADE, related_name='radio_shows')
    name = models.CharField(max_length=200)
    show_type = models.CharField(max_length=30, choices=SHOW_TYPES)
    description = models.TextField(blank=True)
    default_presenter = models.ForeignKey('accounts.User', null=True, blank=True, on_delete=models.SET_NULL)
    colour = models.CharField(max_length=7, default='#3B82F6')

    def __str__(self): return self.name


class RadioSlot(TimeStampedModel):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'), ('live', 'Live'),
        ('completed', 'Completed'), ('cancelled', 'Cancelled'), ('no_show', 'No Show'),
    ]
    organisation = models.ForeignKey('accounts.Organisation', on_delete=models.CASCADE, related_name='radio_slots')
    frequency = models.ForeignKey(RadioFrequency, on_delete=models.CASCADE, related_name='slots')
    show = models.ForeignKey(RadioShow, on_delete=models.CASCADE, related_name='slots')
    presenter = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='radio_slots')
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    show_plan = models.TextField(blank=True, help_text='Topics, guests, content notes submitted by presenter')
    show_plan_submitted_at = models.DateTimeField(null=True, blank=True)
    reminder_24h_sent = models.BooleanField(default=False)
    reminder_2h_sent = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

<<<<<<< HEAD
    class Meta:  # type: ignore
=======
    class Meta:
>>>>>>> origin/main
        ordering = ['start_datetime']
        indexes = [models.Index(fields=['start_datetime', 'frequency']), models.Index(fields=['presenter'])]

    def __str__(self):
        return f"{self.show.name} — {self.start_datetime.strftime('%Y-%m-%d %H:%M')}"

    def save(self, *args, **kwargs):
        # Conflict check
        if not self.pk:
            conflict = RadioSlot.objects.filter(
                frequency=self.frequency,
                status__in=['scheduled', 'live'],
                start_datetime__lt=self.end_datetime,
                end_datetime__gt=self.start_datetime,
            ).exists()
            if conflict:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'detail': 'This frequency already has a slot booked for the selected time.'})
        super().save(*args, **kwargs)


# ═══════════════════════════════════════════════════════════════
# SOFTWARE SUBSCRIPTIONS
# ═══════════════════════════════════════════════════════════════

class SoftwareSubscription(TimeStampedModel):
    STATUS_CHOICES = [
        ('active', 'Active'), ('expired', 'Expired'),
        ('expiring_soon', 'Expiring Soon'), ('cancelled', 'Cancelled'),
    ]
    organisation = models.ForeignKey('accounts.Organisation', on_delete=models.CASCADE, related_name='software_subscriptions')
    software_name = models.CharField(max_length=200)
    vendor = models.CharField(max_length=200, blank=True)
    version = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    total_seats = models.IntegerField(default=1)
    expiry_date = models.DateField()
    renewal_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='KES')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    licence_key = models.TextField(blank=True)
    licence_file = models.FileField(upload_to='subscriptions/licences/', null=True, blank=True)
    notes = models.TextField(blank=True)
    alert_30_sent = models.BooleanField(default=False)
    alert_7_sent = models.BooleanField(default=False)
    auto_renew = models.BooleanField(default=False)

<<<<<<< HEAD
    class Meta:  # type: ignore
=======
    class Meta:
>>>>>>> origin/main
        ordering = ['expiry_date']

    def __str__(self): return f"{self.software_name} — expires {self.expiry_date}"

    @property
    def allocated_seats(self):
        return self.seat_allocations.filter(is_active=True).count()

    @property
    def available_seats(self):
        return self.total_seats - self.allocated_seats

    @property
    def days_until_expiry(self):
        return (self.expiry_date - timezone.now().date()).days


class SeatAllocation(TimeStampedModel):
    subscription = models.ForeignKey(SoftwareSubscription, on_delete=models.CASCADE, related_name='seat_allocations')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='software_seats')
    allocated_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='allocations_made')
    allocated_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

<<<<<<< HEAD
    class Meta:  # type: ignore
=======
    class Meta:
>>>>>>> origin/main
        unique_together = [['subscription', 'user']]


class SeatRequest(TimeStampedModel):
    STATUS_CHOICES = [
        ('pending', 'Pending'), ('approved', 'Approved'),
        ('rejected', 'Rejected'), ('waitlisted', 'Waitlisted'),
    ]
    subscription = models.ForeignKey(SoftwareSubscription, on_delete=models.CASCADE, related_name='seat_requests')
    requested_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='seat_requests')
    purpose = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey('accounts.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='seat_reviews')
    rejection_reason = models.TextField(blank=True)

<<<<<<< HEAD
    class Meta:  # type: ignore
=======
    class Meta:
>>>>>>> origin/main
        ordering = ['-created_at']


# ─── SERIALIZERS ─────────────────────────────────────────────────────────────

class NewsStorySerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    editor_name = serializers.CharField(source='editor.full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_colour = serializers.CharField(source='category.colour', read_only=True)

<<<<<<< HEAD
    class Meta:  # type: ignore
=======
    class Meta:
>>>>>>> origin/main
        model = NewsStory
        fields = '__all__'
        read_only_fields = ['author', 'word_count', 'view_count']


class RadioSlotSerializer(serializers.ModelSerializer):
    presenter_name = serializers.CharField(source='presenter.full_name', read_only=True)
    show_name = serializers.CharField(source='show.name', read_only=True)
    show_type = serializers.CharField(source='show.show_type', read_only=True)
    show_colour = serializers.CharField(source='show.colour', read_only=True)
    frequency_name = serializers.CharField(source='frequency.name', read_only=True)

<<<<<<< HEAD
    class Meta:  # type: ignore
=======
    class Meta:
>>>>>>> origin/main
        model = RadioSlot
        fields = '__all__'


class SoftwareSubscriptionSerializer(serializers.ModelSerializer):
    allocated_seats = serializers.ReadOnlyField()
    available_seats = serializers.ReadOnlyField()
    days_until_expiry = serializers.ReadOnlyField()
    seat_holders = serializers.SerializerMethodField()

<<<<<<< HEAD
    class Meta:  # type: ignore
=======
    class Meta:
>>>>>>> origin/main
        model = SoftwareSubscription
        exclude = ['licence_key']  # Don't expose licence keys in list

    def get_seat_holders(self, obj):
        allocs = obj.seat_allocations.filter(is_active=True).select_related('user')
        return [{'id': str(a.user.id), 'name': a.user.full_name, 'email': a.user.email} for a in allocs]


# ─── VIEWS ───────────────────────────────────────────────────────────────────

class NewsStoryListView(generics.ListCreateAPIView):
    serializer_class = NewsStorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'body', 'tags']

    def get_queryset(self):
        user = self.request.user
        qs = NewsStory.objects.filter(organisation=user.organisation).select_related('author', 'category')
        if user.role == 'journalist':
            return qs.filter(author=user)
        if user.role in ['editor', 'broadcast_admin', 'broadcast_staff']:
            return qs
        return qs.filter(status='published')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, organisation=self.request.user.organisation)


class NewsStoryReviewView(APIView):
    def post(self, request, pk):
        try:
            story = NewsStory.objects.get(pk=pk, organisation=request.user.organisation)
        except NewsStory.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)

        action = request.data.get('action')
        comment = request.data.get('comment', '')

        if action == 'approve':
            story.status = 'approved'
            story.editor = request.user
        elif action == 'request_changes':
            story.status = 'changes_requested'
        elif action == 'reject':
            story.status = 'rejected'
        elif action == 'publish':
            story.status = 'published'
            story.published_at = timezone.now()
        else:
            return Response({'detail': 'Invalid action'}, status=400)

        story.save()

        if comment:
            EditorialComment.objects.create(story=story, author=request.user, comment=comment)

        # Notify author
        try:
            from apps.notifications.services import NotificationService
            NotificationService.notify_user(
                story.author,
                f"Story {action.replace('_', ' ').title()} — {story.title}",
                comment or f"Your story has been {action.replace('_', ' ')}.",
                'story_review'
            )
        except Exception:
            pass

        return Response(NewsStorySerializer(story).data)


class RadioScheduleView(generics.ListCreateAPIView):
    serializer_class = RadioSlotSerializer

    def get_queryset(self):
        user = self.request.user
        qs = RadioSlot.objects.filter(
            organisation=user.organisation
        ).select_related('presenter', 'show', 'frequency')

        if user.role == 'presenter':
            qs = qs.filter(presenter=user)

        start = self.request.query_params.get('start')
        end = self.request.query_params.get('end')
        if start:
            qs = qs.filter(start_datetime__gte=start)
        if end:
            qs = qs.filter(end_datetime__lte=end)
        return qs

    def perform_create(self, serializer):
        serializer.save(organisation=self.request.user.organisation)


class SubmitShowPlanView(APIView):
    def post(self, request, pk):
        try:
            slot = RadioSlot.objects.get(pk=pk, presenter=request.user)
        except RadioSlot.DoesNotExist:
            return Response({'detail': 'Slot not found or not assigned to you'}, status=404)

        slot.show_plan = request.data.get('show_plan', '')
        slot.show_plan_submitted_at = timezone.now()
        slot.save()
        return Response(RadioSlotSerializer(slot).data)


class SubscriptionListView(generics.ListCreateAPIView):
    serializer_class = SoftwareSubscriptionSerializer

    def get_queryset(self):
        return SoftwareSubscription.objects.filter(organisation=self.request.user.organisation)

    def perform_create(self, serializer):
        serializer.save(organisation=self.request.user.organisation)


class RequestSeatView(APIView):
    def post(self, request, subscription_id):
        try:
            sub = SoftwareSubscription.objects.get(id=subscription_id, organisation=request.user.organisation)
        except SoftwareSubscription.DoesNotExist:
            return Response({'detail': 'Subscription not found'}, status=404)

        if sub.available_seats <= 0:
            SeatRequest.objects.create(
                subscription=sub, requested_by=request.user,
                purpose=request.data.get('purpose', ''), status='waitlisted'
            )
            return Response({'detail': 'No seats available — added to waitlist', 'status': 'waitlisted'})

        req = SeatRequest.objects.create(
            subscription=sub, requested_by=request.user,
            purpose=request.data.get('purpose', '')
        )
        return Response({'id': str(req.id), 'status': 'pending', 'detail': 'Request submitted for approval'}, status=201)


class AllocateSeatView(APIView):
    def post(self, request, request_id):
        try:
            req = SeatRequest.objects.get(id=request_id, subscription__organisation=request.user.organisation)
        except SeatRequest.DoesNotExist:
            return Response({'detail': 'Request not found'}, status=404)

        action = request.data.get('action')
        if action == 'approve':
            if req.subscription.available_seats <= 0:
                return Response({'detail': 'No seats available'}, status=400)
            SeatAllocation.objects.get_or_create(
                subscription=req.subscription,
                user=req.requested_by,
                defaults={'allocated_by': request.user}
            )
            req.status = 'approved'
        elif action == 'reject':
            req.status = 'rejected'
            req.rejection_reason = request.data.get('reason', '')
        else:
            return Response({'detail': 'action must be approve or reject'}, status=400)

        req.reviewed_by = request.user
        req.save()
        return Response({'status': req.status})
