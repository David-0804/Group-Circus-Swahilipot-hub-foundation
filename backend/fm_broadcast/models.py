from django.db import models
from django.conf import settings

class FMFrequency(models.Model):
    frequency_mhz = models.DecimalField(max_digits=6, decimal_places=1)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    def __str__(self): return f'{self.name} ({self.frequency_mhz} MHz)'

class StationStatus(models.Model):
    STATUS = [('on_air','On Air'),('off_air','Off Air')]
    frequency = models.ForeignKey(FMFrequency, on_delete=models.CASCADE, related_name='statuses')
    status = models.CharField(max_length=10, choices=STATUS, default='on_air')
    changed_at = models.DateTimeField(auto_now_add=True)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    class Meta: ordering = ['-changed_at']

class OutageReport(models.Model):
    frequency = models.ForeignKey(FMFrequency, on_delete=models.CASCADE, related_name='outages')
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.DecimalField(max_digits=8, decimal_places=1, null=True, blank=True)
    auto_detected = models.BooleanField(default=False)
    class Meta: ordering = ['-started_at']

class RadioSchedule(models.Model):
    SHOW_TYPES = [('news','News'),('music','Music'),('talk','Talk'),('sport','Sport'),('features','Features')]
    STATUS = [('scheduled','Scheduled'),('on_air','On Air'),('completed','Completed'),('cancelled','Cancelled')]
    frequency = models.ForeignKey(FMFrequency, on_delete=models.CASCADE, related_name='schedules')
    presenter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='schedules')
    show_name = models.CharField(max_length=200)
    show_type = models.CharField(max_length=20, choices=SHOW_TYPES, default='music')
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS, default='scheduled')
    class Meta: ordering = ['start_datetime']

class ShowPlan(models.Model):
    schedule = models.OneToOneField(RadioSchedule, on_delete=models.CASCADE, related_name='show_plan')
    content_notes = models.TextField()
    guests = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

class CallRecord(models.Model):
    TYPES = [('on_air','On Air'),('internal','Internal'),('external','External')]
    studio = models.CharField(max_length=100)
    operator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0)
    audio_file = models.FileField(upload_to='calls/%Y/%m/', null=True, blank=True)
    call_type = models.CharField(max_length=20, choices=TYPES, default='on_air')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['-created_at']
