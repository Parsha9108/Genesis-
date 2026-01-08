from django.urls import re_path
from .consumer import AgentMonitoringConsumer,FrontendMonitoringConsumer

websocket_urlpatterns = [
    re_path(r'api/agent/bridge/', AgentMonitoringConsumer.as_asgi()),
    re_path(r'webapp/api/agent/$',FrontendMonitoringConsumer.as_asgi()),
]
