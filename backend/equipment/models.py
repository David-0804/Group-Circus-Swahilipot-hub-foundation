from django.db import models
from django.conf import settings

class EquipmentCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    def __str__(self): return self.name

class EquipmentItem(models.Model):
    STATUS = [('available','Available'),('checked_out','Checked Out'),
              ('under_repair','Under Repair'),('retired','Retired')]
    CONDITION = [('new','New'),('good','Good'),('fair','Fair'),('poor','Poor')]
    name = models.CharField(max_length=200)
    category = models.ForeignKey(EquipmentCategory, on_delete=models.SET_NULL, null=True)
    serial_number = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    condition = models.CharField(max_length=20, choices=CONDITION, default='good')
    status = models.CharField(max_length=20, choices=STATUS, default='available')
    photo = models.ImageField(upload_to='equipment/', null=True, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.name

class CheckoutRequest(models.Model):
    STATUS = [('pending','Pending'),('approved','Approved'),('rejected','Rejected'),
              ('returned','Returned'),('overdue','Overdue')]
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='checkout_requests')
    items = models.ManyToManyField(EquipmentItem, related_name='checkout_requests')
    start_date = models.DateField()
    end_date = models.DateField()
    purpose = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                     null=True, blank=True, related_name='reviewed_requests')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    return_confirmed_at = models.DateTimeField(null=True, blank=True)
    def __str__(self): return f'{self.requester} - {self.status}'

class MaintenanceRecord(models.Model):
    STATUS = [('reported','Reported'),('in_repair','In Repair'),('resolved','Resolved')]
    item = models.ForeignKey(EquipmentItem, on_delete=models.CASCADE, related_name='maintenance_records')
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    description = models.TextField()
    reported_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS, default='reported')
    resolved_at = models.DateTimeField(null=True, blank=True)
    repair_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    def __str__(self): return f'{self.item.name} - {self.status}'
