<<<<<<< HEAD
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Nexus.settings")
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from apps.chat.middleware import JWTAuthMiddleware
from apps.chat.routing import websocket_urlpatterns

# Merge with any existing core ws routes
try:
    from core.ws_routing import websocket_urlpatterns as core_ws
    all_ws = websocket_urlpatterns + core_ws
except ImportError:
    all_ws = websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddleware(URLRouter(all_ws))
    ),
})
=======
"""Nexus ASGI Configuration — HTTP + WebSocket"""
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Nexus.settings')

django_asgi_app = get_asgi_application()

# Import websocket routing after Django is set up
from core.ws_routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
>>>>>>> origin/main
