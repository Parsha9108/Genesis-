from django.db import models
import uuid
from django.utils import timezone
class Demo(models.Model):
   
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.name}" 
class DemoCheckpoint(models.Model):
    demo = models.ForeignKey(
        Demo,
        on_delete=models.CASCADE,
        related_name='checkpoints'
    )
    status = models.CharField(max_length=20, default='unknown')
    value = models.FloatField(null=True, blank=True)    
    created_at= models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Checkpoint for {self.demo.name} at {self.created_at}"