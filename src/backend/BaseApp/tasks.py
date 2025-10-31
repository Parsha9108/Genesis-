
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Agent
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Agent
from .serializer import WebAgentSerializer
from uuid import UUID

def convert_uuids(obj):
    """Recursively convert UUID objects to strings for JSON serialization"""
    if isinstance(obj, UUID):
        return str(obj)
    elif isinstance(obj, dict):
        return {
            (str(k) if isinstance(k, UUID) else k): convert_uuids(v)
            for k, v in obj.items()
        }
    elif isinstance(obj, list):
        return [convert_uuids(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_uuids(item) for item in obj)
    return obj


@shared_task
def mark_inactive_agents():
    print("=== CELERY: Starting mark_inactive_agents ===")
    threshold = timezone.now() - timedelta(minutes=1)
    inactive_agents = Agent.objects.filter(last_seen__lt=threshold, status=Agent.STATUS_ACTIVE)
    
    # Get channel layer for WebSocket broadcasting
    channel_layer = get_channel_layer()

    for agent in inactive_agents:
        
        agent.mark_inactive()
        try:
            serializer = WebAgentSerializer(agent)
            safe_data = convert_uuids(serializer.data)
            async_to_sync(channel_layer.group_send)(
                "monitoring_all",
                {
                    "type": "agent_update",
                    "data": safe_data,
                }
            )
        except Exception as e:
            print(f"Failed to send WebSocket update for agent {agent.uuid}: {e}")
    
    print("Completed marking inactive agents.")
