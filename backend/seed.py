import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import CustomUser
from equipment.models import EquipmentCategory, EquipmentItem
from fm_broadcast.models import FMFrequency, StationStatus, RadioSchedule
from news.models import NewsCategory, NewsStory
from projects.models import Course
from infrastructure.models import FeedbackCategory, Software, Licence
from videography.models import ShootLocation
from django.utils import timezone

print("Seeding users...")
admin = CustomUser.objects.create_superuser(email='admin@bmi.ac.ke', password='Admin@1234', full_name='System Administrator', department='Administration', role='admin')
staff = CustomUser.objects.create_user(email='staff@bmi.ac.ke', password='Staff@1234', full_name='Jane Mwangi', department='Broadcasting', role='staff')
it = CustomUser.objects.create_user(email='it@bmi.ac.ke', password='IT@12345!', full_name='Peter Otieno', department='IT', role='it')
student1 = CustomUser.objects.create_user(email='student@bmi.ac.ke', password='Student@1234', full_name='Alice Njeri', department='Radio Production', role='student')
student2 = CustomUser.objects.create_user(email='student2@bmi.ac.ke', password='Student@1234', full_name='Brian Kipchoge', department='News Media', role='student')

print("Seeding equipment...")
cam = EquipmentCategory.objects.create(name='Camera', description='Video and photography cameras')
audio = EquipmentCategory.objects.create(name='Audio', description='Microphones and mixers')
lighting = EquipmentCategory.objects.create(name='Lighting', description='Studio and field lighting')
EquipmentItem.objects.create(name='Sony A7III Camera', category=cam, serial_number='SN-A7-001', condition='good', status='available')
EquipmentItem.objects.create(name='Canon 5D Mark IV', category=cam, serial_number='SN-5D-002', condition='good', status='available')
EquipmentItem.objects.create(name='Rode NTG5 Shotgun Mic', category=audio, serial_number='SN-RODE-001', condition='good', status='available')
EquipmentItem.objects.create(name='Zoom H6 Audio Recorder', category=audio, serial_number='SN-ZH6-001', condition='fair', status='available')
EquipmentItem.objects.create(name='Aputure 120D II Light', category=lighting, serial_number='SN-AP-001', condition='good', status='available')
EquipmentItem.objects.create(name='Sennheiser Wireless Set', category=audio, serial_number='SN-SEN-001', condition='good', status='available')

print("Seeding FM...")
freq1 = FMFrequency.objects.create(frequency_mhz=91.1, name='BMI FM 91.1', description='Main broadcast frequency', is_active=True)
freq2 = FMFrequency.objects.create(frequency_mhz=98.4, name='BMI Campus 98.4', description='Campus station', is_active=True)
StationStatus.objects.create(frequency=freq1, status='on_air', changed_by=admin)
StationStatus.objects.create(frequency=freq2, status='on_air', changed_by=admin)
now = timezone.now()
RadioSchedule.objects.create(frequency=freq1, presenter=staff, show_name='Morning Drive', show_type='music',
    start_datetime=now.replace(hour=6,minute=0,second=0), end_datetime=now.replace(hour=9,minute=0,second=0))
RadioSchedule.objects.create(frequency=freq1, presenter=staff, show_name='News at Noon', show_type='news',
    start_datetime=now.replace(hour=12,minute=0,second=0), end_datetime=now.replace(hour=13,minute=0,second=0))

print("Seeding news categories...")
for name, color in [('Local','#0F6E56'),('National','#0D2240'),('Sport','#993C1D'),
                     ('Entertainment','#BA7517'),('Features','#534AB7'),('Breaking','#CC0000')]:
    NewsCategory.objects.create(name=name, color_hex=color)
cat = NewsCategory.objects.get(name='Local')
story = NewsStory.objects.create(
    title='BMI Launches New Digital Media Studio', journalist=staff, category=cat,
    body='<p>The Broadcast Media Institution today unveiled its state-of-the-art digital media studio...</p>',
    summary='BMI opens new studio facility for students and staff.',
    status='published', published_at=now)

print("Seeding courses...")
Course.objects.create(name='Radio Production Fundamentals', code='RPF101', department='Radio', lecturer=staff)
Course.objects.create(name='News Writing and Reporting', code='NWR201', department='News', lecturer=staff)
Course.objects.create(name='Video Production Techniques', code='VPT301', department='Video', lecturer=staff)

print("Seeding feedback categories...")
for name in ['Equipment','Wi-Fi','Software','Scheduling','Facilities','Staff','Other']:
    FeedbackCategory.objects.create(name=name)

print("Seeding software...")
adobe = Software.objects.create(name='Adobe Creative Cloud', vendor='Adobe', category='creative',
    description='Full suite including Premiere Pro, Photoshop, After Effects')
lr = Software.objects.create(name='Adobe Lightroom', vendor='Adobe', category='creative',
    description='Professional photo editing and management')
Licence.objects.create(software=adobe, total_seats=15, expiry_date='2026-12-31', renewal_cost=85000)
Licence.objects.create(software=lr, total_seats=10, expiry_date='2026-09-30', renewal_cost=30000)

print("Seeding locations...")
ShootLocation.objects.create(name='Main Studio A', building='Media Block', room_number='G01', capacity=10)
ShootLocation.objects.create(name='News Studio B', building='Media Block', room_number='G02', capacity=6)
ShootLocation.objects.create(name='Outdoor Courtyard', building='Main Campus', room_number='', capacity=50)

print("\n✅ Seed complete!")
print("\nDemo Credentials:")
print("  Admin:   admin@bmi.ac.ke   / Admin@1234")
print("  Staff:   staff@bmi.ac.ke   / Staff@1234")
print("  IT:      it@bmi.ac.ke      / IT@12345!")
print("  Student: student@bmi.ac.ke / Student@1234")
