
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Agent
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Agent
from .serializer import WebAgentSerializer
from uuid import UUID
from django.core.management import call_command

import logging
logger = logging.getLogger('agent_monitoring')

from BaseApp.services.webapp_services.ip_monitoring.ping_service import parrallel_ping_ips
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




@shared_task(name='BaseApp.tasks.run_retention_cleanup')
def run_retention_cleanup():
    """
    Celery task that calls the cleanup_data management command,
    fetching retention policies from the GlobalConfig table.
    """
    start_time = timezone.now()
    logger.info(f"[{start_time}] Starting Data Retention Cleanup command...")
    
    try:
        # Call the management command by its file name
        call_command('cleanup_data')
        
        end_time = timezone.now()
        duration = (end_time - start_time).total_seconds()
        
        logger.info(f"[{end_time}] Data retention cleanup command executed successfully.")
        logger.info(f"Total execution time: {duration:.2f} seconds.")
        
        return "Cleanup completed"
        
    except Exception as e:
        # Crucial for monitoring: log the failure and re-raise
        logger.info(f"[{timezone.now()}] ERROR during cleanup command execution: {e}")
        # Re-raise the exception so Celery marks the task as failed
        raise e


@shared_task(name='ping_all_ips')
def ping_all_ips_task():
    """
    Celery task to ping all IPs in IPMonitor table.
    Runs automatically based on IPMonitorConfig interval.
    """
    start_time = timezone.now()
    logger.info(f"[{start_time}] Starting IP monitoring ping cycle...")
    
    try:
        result=parrallel_ping_ips()
        
        end_time = timezone.now()
        duration = (end_time - start_time).total_seconds()
        logger.info(f"Result: {result}")
        logger.info(
            f"[{end_time}] IP monitoring completed. "
            f"Total execution time: {duration:.2f} seconds."
        )
    except Exception as e:
        logger.error(f"[{timezone.now()}] ERROR during IP monitoring: {e}", exc_info=True)
        raise e