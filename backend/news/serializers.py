from rest_framework import serializers
from .models import NewsCategory, NewsStory, EditorialReview

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsCategory
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.full_name', read_only=True)
    class Meta:
        model = EditorialReview
        fields = '__all__'
        read_only_fields = ['reviewer','reviewed_at']

class StorySerializer(serializers.ModelSerializer):
    journalist_name = serializers.CharField(source='journalist.full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color_hex', read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    class Meta:
        model = NewsStory
        fields = '__all__'
        read_only_fields = ['journalist','word_count','slug','created_at','updated_at',
                            'submitted_at','published_at']

class StoryPublicSerializer(serializers.ModelSerializer):
    journalist_name = serializers.CharField(source='journalist.full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color_hex', read_only=True)
    class Meta:
        model = NewsStory
        fields = ['id','title','slug','journalist_name','category_name','category_color',
                  'summary','body','is_breaking','word_count','published_at']
