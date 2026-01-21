from django.db import models
import uuid
from django.utils import timezone
class IPMonitor(models.Model):
   
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    name = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(unique=True)
    
    def __str__(self):
        return f"{self.ip_address}" 
    
class IPMonitorCheckpoint(models.Model):
    ip_monitor = models.ForeignKey(
        IPMonitor,
        on_delete=models.CASCADE,
        related_name='checkpoints'
    )
    status = models.CharField(max_length=20, default='unknown')
    min_latency = models.FloatField(null=True, blank=True)    # Minimum latency
    max_latency = models.FloatField(null=True, blank=True)    # Maximum latency
    jitter = models.FloatField(null=True, blank=True)         # Network jitter (ms)
    created_at= models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Checkpoint for {self.ip_monitor.ip_address} at {self.created_at}"
  