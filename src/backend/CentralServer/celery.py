import os
from celery import Celery

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

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')