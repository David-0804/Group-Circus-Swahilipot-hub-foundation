from django.db import models
from django.conf import settings
import uuid

class WifiRequest(models.Model):
    STATUS = [('pending','Pending'),('approved','Approved'),('denied','Denied'),('expired','Expired'),('revoked','Revoked')]
    DEVICE_TYPES = [('laptop','Laptop'),('phone','Phone'),('tablet','Tablet'),('other','Other')]
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wifi_requests')
    device_name = models.CharField(max_length=200)
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPES)
    mac_address = models.CharField(max_length=17, blank=True)
    purpose = models.TextField()
    duration_days = models.IntegerField(default=7)
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                     null=True, blank=True, related_name='reviewed_wifi')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    denial_reason = models.TextField(blank=True)
    access_expires_at = models.DateTimeField(null=True, blank=True)
    access_note = models.TextField(blank=True)
    class Meta: ordering = ['-requested_at']

class Software(models.Model):
    CATEGORIES = [('creative','Creative'),('productivity','Productivity'),
                  ('audio','Audio'),('video','Video'),('other','Other')]
    name = models.CharField(max_length=200)
    vendor = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORIES, default='other')
    is_active = models.BooleanField(default=True)
    def __str__(self): return self.name

class Licence(models.Model):
    software = models.ForeignKey(Software, on_delete=models.CASCADE, related_name='licences')
    total_seats = models.IntegerField(default=1)
    expiry_date = models.DateField()
    renewal_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    @property
    def used_seats(self):
        return self.access_requests.filter(status='approved').count()
    @property
    def available_seats(self):
        return self.total_seats - self.used_seats

class AccessRequest(models.Model):
    STATUS = [('pending','Pending'),('approved','Approved'),('denied','Denied'),('revoked','Revoked')]
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='access_requests')
    licence = models.ForeignKey(Licence, on_delete=models.CASCADE, related_name='access_requests')
    purpose = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                     null=True, blank=True, related_name='reviewed_access')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    access_note = models.TextField(blank=True)
    class Meta: ordering = ['-requested_at']

class TransferPackage(models.Model):
    uploader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transfers')
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    original_filename = models.CharField(max_length=500)
    file = models.FileField(upload_to='transfers/%Y/%m/')
    file_size = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    max_downloads = models.IntegerField(default=1)
    download_count = models.IntegerField(default=0)
    is_expired = models.BooleanField(default=False)
    class Meta: ordering = ['-created_at']

class FeedbackCategory(models.Model):
    name = models.CharField(max_length=100)
    assigned_team = models.CharField(max_length=50, default='admin')
    def __str__(self): return self.name

class Ticket(models.Model):
    URGENCY = [('low','Low'),('medium','Medium'),('high','High'),('critical','Critical')]
    STATUS = [('open','Open'),('in_progress','In Progress'),('resolved','Resolved'),('closed','Closed')]
    submitter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tickets')
    category = models.ForeignKey(FeedbackCategory, on_delete=models.SET_NULL, null=True)
    subject = models.CharField(max_length=300)
    description = models.TextField()
    urgency = models.CharField(max_length=20, choices=URGENCY, default='medium')
    status = models.CharField(max_length=20, choices=STATUS, default='open')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                     null=True, blank=True, related_name='assigned_tickets')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    class Meta: ordering = ['-created_at']

class TicketResponse(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='responses')
    responder = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    message = models.TextField()
    responded_at = models.DateTimeField(auto_now_add=True)
    is_internal = models.BooleanField(default=False)
    class Meta: ordering = ['responded_at']
