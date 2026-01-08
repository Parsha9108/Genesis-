import os
from celery import Celery
from celery.signals import beat_init

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CentralServer.settings')
app = Celery('CentralServer')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
# Ensure timezone consistency
app.conf.update(
    timezone='Asia/Kolkata',
    enable_utc=True,
    beat_scheduler='django_celery_beat.schedulers:DatabaseScheduler',
)
app.autodiscover_tasks(['BaseApp'])

@beat_init.connect
def setup_periodic_tasks(sender, **kwargs):
    """One-time setup when Celery Beat starts"""
    try:
        from BaseApp.models import GlobalConfig
        from django_celery_beat.models import PeriodicTask, IntervalSchedule
        import logging
        
        logger = logging.getLogger('agent_monitoring')
        
        # Get or create default config
        ping_config= GlobalConfig.objects.get(
            item_key='monitoring.ip_ping_interval',
        )
        
        interval_seconds = int(ping_config.item_value)
        
        if interval_seconds <= 0:
            logger.warning("IP monitoring disabled (interval <= 0)")
            return
        
        # Get or create interval schedule
        schedule, _ = IntervalSchedule.objects.get_or_create(
            every=interval_seconds,
            period=IntervalSchedule.SECONDS,
        )
        
        # Get or create periodic task
        task_name = 'Auto Ping All IPs'
        task, task_created = PeriodicTask.objects.get_or_create(
            name=task_name,
            defaults={
                'task': 'ping_all_ips',
                'interval': schedule,
                'enabled': True
            }
        )
        
        if task_created:
            logger.info(f"Created IP monitoring task: {interval_seconds}s")
        else:
            logger.info(f"IP monitoring task exists: {task.interval.every}s")
    
    except Exception as e:
        import logging
        import traceback
        logger = logging.getLogger('agent_monitoring')
        logger.error(f"Setup failed: {str(e)}")
        traceback.print_exc()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
