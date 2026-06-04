from django.db import models
from django.utils.text import slugify
from django.conf import settings

class NewsCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    color_hex = models.CharField(max_length=7, default='#0F6E56')
    is_active = models.BooleanField(default=True)
    def save(self, *args, **kwargs):
        if not self.slug: self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    def __str__(self): return self.name

class NewsStory(models.Model):
    STATUS = [('draft','Draft'),('submitted','Submitted'),('under_review','Under Review'),
              ('changes_requested','Changes Requested'),('approved','Approved'),
              ('published','Published'),('archived','Archived'),('rejected','Rejected')]
    title = models.CharField(max_length=500)
    slug = models.SlugField(unique=True, blank=True, max_length=600)
    journalist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='news_stories')
    category = models.ForeignKey(NewsCategory, on_delete=models.SET_NULL, null=True)
    body = models.TextField()
    summary = models.CharField(max_length=300, blank=True)
    status = models.CharField(max_length=30, choices=STATUS, default='draft')
    is_breaking = models.BooleanField(default=False)
    word_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:550]
            slug = base
            n = 1
            while NewsStory.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base}-{n}'; n += 1
            self.slug = slug
        import re
        text = re.sub(r'<[^>]+>', '', self.body)
        self.word_count = len(text.split())
        super().save(*args, **kwargs)
    class Meta: ordering = ['-created_at']

class EditorialReview(models.Model):
    ACTIONS = [('approved','Approved'),('changes_requested','Changes Requested'),
               ('rejected','Rejected'),('published','Published'),('archived','Archived')]
    story = models.ForeignKey(NewsStory, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=30, choices=ACTIONS)
    comment = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['-reviewed_at']
