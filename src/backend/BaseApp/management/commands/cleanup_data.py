# BaseApp/management/commands/cleanup_data.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date
from django.db import transaction
from BaseApp.models import AuditLog
from BaseApp.models import GlobalConfig
from BaseApp.models import MonitoringCheckpoint

class Command(BaseCommand):
    def handle(self, *args, **options):
        today_str = str(date.today())
        print(f"=== Starting data cleanup for {today_str} ===")
        #  Check if it already ran today
        last_run_config= GlobalConfig.objects.get(
            item_key='dataretention.last_run', 
        )
        print(f"Last run date: {last_run_config.item_value}")
        if last_run_config.item_value == today_str:
            self.stdout.write(self.style.SUCCESS("Cleanup already completed for today. Skipping..."))
            return  # Exit here so Task B doesn't repeat Task A's work
        
        DEFAULT_RETENTION_DAYS = 30
        # Get the retention days
        try:
            monitoringdata_retention_entry = GlobalConfig.objects.get(item_key='dataretention.monitoring')
            monitoringdata_retention_days = int(monitoringdata_retention_entry.item_value)
        except:
            monitoringdata_retention_days= DEFAULT_RETENTION_DAYS
        try:
            auditlogs_retention_entry = GlobalConfig.objects.get(item_key='dataretention.auditlogs')
            auditlogs_retention_days=int(auditlogs_retention_entry.item_value)
        except:
            auditlogs_retention_days=DEFAULT_RETENTION_DAYS
            
        with transaction.atomic():
            #  Perform Deletion
            cutoff = timezone.now() - timezone.timedelta(days=monitoringdata_retention_days)
            deleted_count, _ = MonitoringCheckpoint.objects.filter(created_at__lt=cutoff).delete()
            
            # Audit logs – adjust field name to your model (e.g. created_at or timestamp)
            audit_cutoff = timezone.now() - timezone.timedelta(days=auditlogs_retention_days)
            audit_deleted, _ = AuditLog.objects.filter(timestamp__lt=audit_cutoff).delete()
            # UPDATE the last run date to today
            last_run_config.item_value = today_str
            last_run_config.save()

            self.stdout.write(self.style.SUCCESS(f"Deleted of monitoring {deleted_count} and auditlogs {audit_deleted} records and updated last run date."))