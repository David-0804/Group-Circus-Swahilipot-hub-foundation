from django.contrib import admin
from . import models
for name in dir(models):
    obj = getattr(models, name)
    try:
        if hasattr(obj, '_meta') and not obj._meta.abstract:
            admin.site.register(obj)
    except Exception:
        pass
