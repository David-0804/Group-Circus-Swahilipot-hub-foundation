from django.db import models
from django.conf import settings
from equipment.models import EquipmentItem

class ShootLocation(models.Model):
    name = models.CharField(max_length=200)
    building = models.CharField(max_length=100)
    room_number = models.CharField(max_length=20, blank=True)
    capacity = models.IntegerField(default=1)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    def __str__(self): return f'{self.name} ({self.building})'

class ShootBooking(models.Model):
    STATUS = [('pending','Pending'),('approved','Approved'),('declined','Declined'),
              ('completed','Completed'),('cancelled','Cancelled')]
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shoot_bookings')
    title = models.CharField(max_length=300)
    location = models.ForeignKey(ShootLocation, on_delete=models.SET_NULL, null=True)
    shoot_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    equipment_items = models.ManyToManyField(EquipmentItem, blank=True)
    purpose = models.TextField()
    production_brief = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                     null=True, blank=True, related_name='approved_shoots')
    approved_at = models.DateTimeField(null=True, blank=True)
    decline_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['-created_at']
    def __str__(self): return f'{self.title} - {self.shoot_date}'

class FootageUpload(models.Model):
    TYPES = [('video','Video'),('audio','Audio'),('image','Image'),('other','Other')]
    booking = models.ForeignKey(ShootBooking, on_delete=models.CASCADE, related_name='footage')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    file = models.FileField(upload_to='footage/%Y/%m/')
    original_filename = models.CharField(max_length=500)
    file_size = models.BigIntegerField(default=0)
    file_type = models.CharField(max_length=20, choices=TYPES, default='video')
    description = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['-uploaded_at']
