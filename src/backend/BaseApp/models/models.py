from pyexpat import model
from time import timezone
from django.db import models
from datetime import timedelta
from django.utils import timezone
import uuid
from simple_history.models import HistoricalRecords
from oauth2_provider.models import Application, get_access_token_model
from simple_history.utils import update_change_reason
from .roles import Role
from .base_audit_model import BaseAuditModel



def update_storage_view(request):
    storage = Storage.objects.get(...)
    update_change_reason(storage, "Updated disk usage based on monitoring data.")
    storage.total_disk_usage = "..."
    storage.save()


def convert_bytes_to_human_readable(num_bytes, preferred_unit):
    """
    Convert bytes to a human-readable format.
    """
    try:
        num_bytes = float(num_bytes)

        unit_map = {
            "BYTES": 1,
            "KB": 1024,
            "MB": 1024 ** 2, 
            "GB": 1024 ** 3,
            "TB": 1024 ** 4
        }
        
        if preferred_unit:
            preferred_unit = preferred_unit.upper()
            if preferred_unit not in unit_map:
                return f"Error: Unsupported unit '{preferred_unit}'"

            value = num_bytes / unit_map[preferred_unit]
            return f"{value:.2f} {preferred_unit}"
        
        else:

            if num_bytes >= 1024 ** 3:
                value = num_bytes / (1024 ** 3)
                unit = "GB"
            elif num_bytes >= 1024 ** 2:
                value = num_bytes / (1024 ** 2)
                unit = "MB"
            elif num_bytes >= 1024:
                value = num_bytes / 1024
                unit = "KB"
            else:
                value = num_bytes
                unit = "Bytes"

            return f"{value:.2f} {unit}"
    except (ValueError, TypeError) as e:
        return "Error: Invalid input value."
    
def parse_operating_speed(speed_str):
    """Convert '1.0 Gbps', '100.0 Mbps', etc. into bits per second (int)."""
    import re

    if not speed_str:
        return None

    match = re.match(r'([\d.]+)\s*(gbps|mbps|kbps|bps)', speed_str.strip().lower())
    if not match:
        return None

    value, unit = match.groups()
    value = float(value)

    unit_map = {
        'bps': 1,
        'kbps': 1_000,
        'mbps': 1_000_000,
        'gbps': 1_000_000_000,
    }
    value = int(value * unit_map[unit])
    return value

def convert_speed_str_to_bps(speed_str: str) -> int:
    """
    Convert a speed string like '1Gbps' to bits per second.
    """
    units = {
        'bps': 1,
        'Kbps': 1_000,
        'Mbps': 1_000_000,
        'Gbps': 1_000_000_000,
        'Tbps': 1_000_000_000_000
    }
    try:
        for unit, multiplier in units.items():
            if unit.lower() in speed_str.lower():
                value = float(speed_str.lower().replace(unit.lower(), '').strip())
                return int(value * multiplier)
    except Exception as e:
        print(f"Invalid speed format '{speed_str}': {e}")
    return 0
    
def convert_speed(speed,unit):
    """
    Convert speed to a human-readable format.
    """
    try:
        if unit == "Hz":
            # convert from hz to MHz
            return f"{speed / 1e6} {unit}"
        elif unit == "GHz":
            # Convert from GHz to MHz
            return f"{speed * 1000} {unit}"
        elif unit == "MHz":
            # Already in MHz, so return as is.
            return f"{speed} {unit}"
        else:
            raise ValueError("Unsupported speed unit. Use 'Hz', 'MHz', or 'GHz'.")
    except (ValueError, TypeError) as e:
        print(f"Error: Invalid input value. Details: {e}")
        return "Error: Invalid input value."
    
def convert_bandwidth(bits_per_sec):
    """
    Convert bits per second into Kbps, Mbps, or Gbps.
    """
    try:
        bits_per_sec = float(bits_per_sec)
        
        if bits_per_sec >= 1_000_000_000:
            return f"{round(bits_per_sec / 1_000_000_000, 2)} Gbps"
        elif bits_per_sec >= 1_000_000:
            return f"{round(bits_per_sec / 1_000_000, 2)} Mbps"
        elif bits_per_sec >= 1_000:
            return f"{round(bits_per_sec / 1_000, 2)} Kbps"
        else:
            return f"{round(bits_per_sec)} Bps"
    except (ValueError, TypeError) as e:
        print(f"Error: Invalid input value. Details: {e}")
        return "Error: Invalid input value."
            
def add_percentage(value):
    """
    Add percentage symbol to a value.
    """
    try:    
        return f"{value} %"
    except (ValueError, TypeError) as e:
        return "Error: Invalid input."
def is_valid_uuid(val):
    try:
        uuid.UUID(str(val))
        return True
    except Exception:
        return False
# models/monitoring_session.py



class PendingDeletion(models.Model):
    uuid = models.CharField(max_length=100, unique=True)
    entity_type = models.CharField(max_length=50)
    device_uuid = models.CharField(max_length=100)
    missing_count = models.PositiveIntegerField(default=0)  # Incremented each monitoring cycle 
    created_at = models.DateTimeField(auto_now_add=True)
    
class Agent(models.Model):
    uuid = models.UUIDField(primary_key=True,  default=uuid.uuid4, editable=False)
    hostname = models.CharField(max_length=100)
    os = models.CharField(max_length=100)
    os_version = models.CharField(max_length=100)
    oauth_application = models.OneToOneField(Application, null=True, blank=True, on_delete=models.CASCADE)
    master_key = models.CharField(max_length=260)
    created_at = models.DateTimeField(auto_now_add=True)
   
    STATUS_ACTIVE = "Active"
    STATUS_INACTIVE = "Inactive"
    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_INACTIVE, "Inactive"),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_INACTIVE)
    last_seen = models.DateTimeField(null=True, blank=True)
    last_activated_at = models.DateTimeField(null=True, blank=True)
    uptime_started_at = models.DateTimeField(null=True, blank=True)
    last_uptime_duration = models.DurationField(null=True, blank=True)

    def mark_active(self):
     
        
        now = timezone.now()
        
        if self.status != self.STATUS_ACTIVE:
            self.status = self.STATUS_ACTIVE
            self.last_activated_at = now
            self.uptime_started_at = now    
        self.last_seen = now
        self.save(update_fields=["status", "last_seen", "last_activated_at", 'uptime_started_at'])
        
        
    def mark_inactive(self):
        if self.status == self.STATUS_ACTIVE:
            duration = timezone.now() - self.last_activated_at
            self.last_uptime_duration = duration
        self.status = self.STATUS_INACTIVE
        self.save(update_fields=["status", "last_uptime_duration"])
        
        try:
        # Optionally end active session if you’re tracking it
            from BaseApp.services.agent_monitoring.monitoring_sessionservice import MonitoringSessionService
            MonitoringSessionService.end_session(agent=self)

        except Exception as session_err:
            print(f"Warning: Could not end session: {session_err}")
        
    def validate_access_token(self, access_token):
        token_object = get_access_token_model().objects.get(token=access_token)
        if token_object:
            print(token_object.application == self.oauth_application)
            if token_object.application == self.oauth_application:
                if token_object.is_expired():
                    print("Access Token Expired...")
                    return False
                return True
            else:
                print("Sent Token and App Token does not match")
        print("Token Object Not Found")
        return False


class Device(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.OneToOneField(Agent, on_delete=models.CASCADE, related_name='device')
    make = models.CharField(max_length=255)
    model = models.CharField(max_length=255)
    serial_number = models.CharField(max_length=255)
    
    DEVICE_CHOICES = [
        ('Physical Machine', 'Physical Machine'),
        ('Virtual Machine', 'Virtual Machine'),
    ]
    dev_phy_vm = models.CharField(max_length=20, choices=DEVICE_CHOICES, default='physical')

    def __str__(self):
        return self.model

class CPU(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='cpu')
    make = models.CharField(max_length=255)
    model = models.CharField(max_length=255)
    p_cores = models.IntegerField()
    l_cores = models.IntegerField()
    speed = models.CharField(max_length=50)
    
    def __str__(self):
        return f"{self.model}  - Device {self.device.uuid}"

class Memory(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='memory')
    make = models.CharField(max_length=255)
    model = models.CharField(max_length=255)
    speed = models.CharField(max_length=50)
    size = models.CharField(max_length=50)
    serial_number = models.CharField(max_length=255)
    history = HistoricalRecords(inherit=True) #enables who made the changes

    def __str__(self):
        return f"{self.make}  - Device {self.device.uuid}"
    def update_total_memory(self,data):
        self.size = data
        print("memory size updated")
        self.save()
        
class Storage(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='storage')

    hw_disk_type = models.CharField(max_length=10)

    make = models.CharField(max_length=255)
    model = models.CharField(max_length=255)
    serial_number = models.CharField(max_length=255)
    base_fs_type = models.CharField(max_length=50,null=True)
    free_space = models.CharField(max_length=50)
    total_disk_usage = models.CharField(max_length=50)
    total_disk_size = models.CharField(max_length=50)
    allocated_disk_size = models.CharField(max_length=50)
    unallocated_disk_size = models.CharField(max_length=50)
    history = HistoricalRecords(inherit=True)
    
    is_flagged = models.BooleanField(default=False)
    flagged_at = models.DateTimeField(null=True, blank=True) 
    flagged_reason = models.TextField(null=True, blank=True) 
    
    # New viewing tracking fields
    is_viewed = models.BooleanField(default=False)
    viewed_at = models.DateTimeField(null=True, blank=True)
    viewed_by = models.ForeignKey(
        'auth.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='viewed_storage'
    )
    
    def mark_as_viewed(self, user=None):
        """Mark this storage as viewed"""
        self.is_viewed = True
        self.viewed_at = timezone.now()
        if user:
            self.viewed_by = user
        self.save(update_fields=['is_viewed', 'viewed_at', 'viewed_by'])
        return f"Storage {self.uuid} marked as viewed"
    
    def update_used_space(self, data):
        """
        Update used space and calculate free space.
        """
        self.total_disk_usage = data

        total_disk_size, total_size_unit = self.total_disk_size.split()
        print(total_disk_size)
        total_disk_usage, used_space_unit = self.total_disk_usage.split()
         
        if total_size_unit != used_space_unit:
             raise ValueError("Units do not match for total and used space.")
        update_change_reason("Updated disk usage based on monitoring data.")
        free_space = float(total_disk_size) - float(total_disk_usage)
        self.free_space = f"{free_space:.2f} {total_size_unit}"
        self.save()
        return f"disk updated successfully:free space {self.free_space}"
        
class Partition(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    storage = models.ForeignKey(Storage, on_delete=models.CASCADE, related_name='partition')
    name = models.CharField(max_length=50)
    serial_number= models.CharField(max_length=50,unique=True)
    fs_type = models.CharField(max_length=50,null=True)
    free_space = models.CharField(max_length=50)
    used_space = models.CharField(max_length=50)
    total_size = models.CharField(max_length=50)
    history = HistoricalRecords(inherit=True)
    
    is_flagged = models.BooleanField(default=False)  
    flagged_at = models.DateTimeField(null=True, blank=True)  
    flagged_reason = models.TextField(null=True, blank=True) 
    def __str__(self):
       return f"Partition {self.name} - Storage {self.storage.uuid}"
   
    is_viewed = models.BooleanField(default=False)
    viewed_at = models.DateTimeField(null=True, blank=True)
    viewed_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='viewed_partitions'
    )
    
    def mark_as_viewed(self, user=None):
        """Mark this partition as viewed"""
        self.is_viewed = True
        self.viewed_at = timezone.now()
        if user:
            self.viewed_by = user
        self.save(update_fields=['is_viewed', 'viewed_at', 'viewed_by'])
        return f"Partition {self.name} marked as viewed"
    
    def update_partition_used_space(self, used_space_str):
        """
        Update the partition's used space and calculate free space.
        Both `used_space_str` and `self.total_size` are expected to be strings like '50.00 GB'.
        """
        try:
            # Split values and units
            total_size_val, total_unit = self.total_size.split()
            print(total_size_val)
            used_size_val, used_unit = used_space_str.split()
            print(used_size_val)

            # Validate units
            if total_unit != used_unit:
                raise ValueError(f"Unit mismatch: total size unit '{total_unit}' vs used space unit '{used_unit}'")

            # Store used space
            self.used_space = used_space_str

            # Calculate and store free space
            free_space = float(total_size_val) - float(used_size_val)
            self.free_space = f"{free_space:.2f} {total_unit}"

            self.save()
            return f"Partition updated successfully: free space = {self.free_space}"

        except ValueError as ve:
            print(f"[ValueError] {ve}")
            raise
        except Exception as e:
            print(f"Error updating partition used space: {e}")
            raise

class NIC(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='nic')
    make = models.CharField(max_length=255)
    model = models.CharField(max_length=255)
    number_of_ports = models.IntegerField()
    max_speed = models.CharField(max_length=50)
    supported_speeds = models.CharField(max_length=255)
    serial_number = models.CharField(max_length=255)
    mac_address = models.CharField(max_length=50)
    history = HistoricalRecords(inherit=True)
    
    is_flagged = models.BooleanField(default=False)
    flagged_at = models.DateTimeField(null=True, blank=True)
    flagged_reason = models.TextField(null=True, blank=True)
    def __str__(self):
        return f"{self.make}  - NIC {self.uuid}"
    
    # viewing tracking fields
    is_viewed = models.BooleanField(default=False)
    viewed_at = models.DateTimeField(null=True, blank=True)
    viewed_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='viewed_nics'
    )
    
    def mark_as_viewed(self, user=None):
        """Mark this NIC as viewed"""
        self.is_viewed = True
        self.viewed_at = timezone.now()
        if user:
            self.viewed_by = user
        self.save(update_fields=['is_viewed', 'viewed_at', 'viewed_by'])
        return f"NIC {self.uuid} marked as viewed"
    
class Port(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nic = models.ForeignKey(NIC, on_delete=models.CASCADE, related_name='port')
    interface_name = models.CharField(max_length=50)
    operating_speed = models.CharField(max_length=50)

    PHYSICAL_LOGICAL_CHOICES = [
        ('physical', 'Physical'),
        ('logical', 'Logical'),
    ]
    is_physical_logical = models.CharField(max_length=15, choices=PHYSICAL_LOGICAL_CHOICES, default='physical')

    LOGICAL_TYPE_CHOICES = [
        ('bridge', 'Bridge'),
        ('vlan', 'VLAN'),
        ('bond', 'Bond'),
        ('vxlan', 'VXLAN'),
        ('vtep', 'VTEP'),
        ('veth', 'VETH'),
    ]
    logical_type = models.CharField(max_length=20, choices=LOGICAL_TYPE_CHOICES, default='bridge')
    
    is_flagged = models.BooleanField(default=False)
    flagged_at = models.DateTimeField(null=True, blank=True)
    flagged_reason = models.TextField(null=True, blank=True)
    
    # New viewing tracking fields
    is_viewed = models.BooleanField(default=False)
    viewed_at = models.DateTimeField(null=True, blank=True)
    viewed_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='viewed_ports'  
    )
    
    def mark_as_viewed(self, user=None):
        """Mark this port as viewed"""
        self.is_viewed = True
        self.viewed_at = timezone.now()
        if user:
            self.viewed_by = user
        self.save(update_fields=['is_viewed', 'viewed_at', 'viewed_by'])
        return f"Port {self.interface_name} marked as viewed"

    def __str__(self):
        return f"{self.interface_name}  - NIC {self.nic.uuid}"
    
class IPAddress(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    port = models.ForeignKey(Port, on_delete=models.CASCADE, related_name='ip')
    address = models.GenericIPAddressField()
    gateway = models.GenericIPAddressField(null=True)
    subnet_mask = models.CharField(max_length=50)
    dns = models.CharField(max_length=50)
    
    def __str__(self):
        return self.address

class GPU(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='gpu')
    make = models.CharField(max_length=255)
    model = models.CharField(max_length=255)
    serial_number = models.CharField(max_length=255)
    size = models.CharField(max_length=50)
    driver = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.model}  - Device {self.device.uuid}"

#  ============================================================================================
#  ---------------Monitoring models-----------------

class Event(models.Model):
    EVENT_TYPES = [
        ("Monitoring Data", "MON_DATA"),
        ("Info", "INFO"),
        ("Alert", "ALERT"),
        ("Error", "ERROR"),
        ("Update","UPDATE"),
        ("Delete", "DELETE"),
        ("Create", "CREATE"),
        ("Connection", "CONNECTION"),
        ("Disconnect", "DISCONNECT"),
    ]
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    description = models.TextField()
    component_type = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return self.event_type    
    
class MonitoringCheckpoint(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='checkpoints')
    event = models.ForeignKey(Event, on_delete=models.SET_NULL, null=True, blank=True, related_name='checkpoints')
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ('agent', 'created_at')
    
    def __str__(self):
        return f"Checkpoint for {self.agent}"

class MemoryMonitoring(models.Model):
    uuid = models.CharField(max_length=100)
    memory=models.ForeignKey(Memory,on_delete=models.CASCADE)
    checkpoint = models.ForeignKey(MonitoringCheckpoint, on_delete=models.CASCADE, related_name='memory_data',unique=False)
    memory_used = models.CharField(max_length=100)
    memory_available = models.CharField(max_length=100)
    total_memory = models.CharField(max_length=100)
    memory_utilization=models.CharField(max_length=50)
    
    def __str__(self):
        return f"Memory monitoring for  - Device {self.memory.device.uuid}"

class CpuMonitoring(models.Model):
    uuid = models.CharField(max_length=100)
    checkpoint = models.ForeignKey(MonitoringCheckpoint, on_delete=models.CASCADE, related_name='cpu_data',unique=False)
    p_cores_perc = models.CharField(max_length=100)
    l_cores_perc = models.CharField(max_length=100)
    ctx_switches = models.CharField(max_length=100)
    hw_irq = models.CharField(max_length=50)
    sw_irq = models.CharField(max_length=50)
    syscalls = models.CharField(max_length=50)
    cpu_utilization=models.CharField(max_length=50)
    cpu= models.ForeignKey(CPU, on_delete=models.CASCADE, related_name='cpu_monitoring_data')
    
    
    def __str__(self):
        return f"CPU monitoring  - Device {self.cpu.device.uuid}"

class DiskMonitoring(models.Model):
    uuid = models.CharField(max_length=100)
    checkpoint = models.ForeignKey(MonitoringCheckpoint, on_delete=models.CASCADE, related_name='disk_data')
    total_disk_size = models.CharField(max_length=100)
    total_disk_usage = models.CharField(max_length=100)
    unallocated_disk_space = models.CharField(max_length=100)
    allocated_disk_space = models.CharField(max_length=100)
    disk_usage_percent = models.CharField(max_length=100)
    read_count_io = models.CharField(max_length=100)
    write_count_io = models.CharField(max_length=100)
    bytes_read_io = models.CharField(max_length=100) 
    bytes_write_io = models.CharField(max_length=100)
    read_time_io = models.CharField(max_length=100)
    write_time_io = models.CharField(max_length=100)
    storage_disk = models.ForeignKey(Storage, on_delete=models.CASCADE, related_name='monitoring_data')
    
    def __str__(self):
        return f"Disk monitoting - Storage {self.uuid}"


class PartitionMonitoring(models.Model):
    uuid = models.CharField(max_length=100)
    checkpoint = models.ForeignKey(MonitoringCheckpoint,on_delete=models.CASCADE,unique=False)
    storage= models.ForeignKey(Storage, on_delete=models.CASCADE, related_name='partition_data')
    free_space = models.CharField(max_length=100)
    used_space = models.CharField(max_length=100)
    used_space_perc = models.CharField(max_length=100)
    partition = models.ForeignKey(Partition, on_delete=models.CASCADE, related_name='monitoring_data')
    
    def __str__(self):
        return f"Partition monitoring  - Storage {self.partition.storage.uuid}"


class NetworkPortMonitoring(models.Model):
    uuid = models.CharField(max_length=100)
    checkpoint = models.ForeignKey(MonitoringCheckpoint, on_delete=models.CASCADE, related_name='network_data')
    bytes_sent = models.BigIntegerField()  
    bytes_received = models.BigIntegerField()
    packet_sent = models.BigIntegerField()
    packet_received = models.BigIntegerField()
    error_in = models.IntegerField()
    error_out = models.IntegerField()
    drop_in = models.IntegerField()
    drop_out = models.IntegerField()
    network_utilization = models.CharField(max_length=100)
    port = models.ForeignKey(Port, on_delete=models.CASCADE, related_name='monitoring_data')
   

    def __str__(self):
        return f"Networkport monitoring for NIC-{self.port.nic.uuid}"


class Alert(models.Model):
    SEVERITY_CHOICES = [
        ('Info', 'Info'),
        ('Warning', 'Warning'),
        ('Critical', 'Critical'),
    ]

    ALERT_TYPE_CHOICES = [
        ('CPU Usage', 'CPU Usage'),
        ('Memory Usage', 'Memory Usage'),
        ('Disk Usage', 'Disk Usage'),
        ('Port Usage', 'Port Usage'),
    ]
    
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='alerts')
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device_name = models.CharField(max_length=100) 
    alert_type = models.CharField(max_length=50, choices=ALERT_TYPE_CHOICES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    source_uuid = models.CharField(max_length=100)  
    message = models.TextField()
    checkpoint = models.ForeignKey(MonitoringCheckpoint, on_delete=models.CASCADE, related_name='alerts')
    details = models.TextField() 
    created_at = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False) 

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.severity.upper()}] {self.alert_type} - {self.source_uuid}"
    
    def mark_as_read(self):
        """Mark this alert as read."""
        self.is_read = True
        self.save(update_fields=['is_read'])
    
    def mark_as_unread(self):
        """Mark this alert as unread."""
        self.is_read = False
        self.save(update_fields=['is_read']) 
          
class MonitoringSession(models.Model):
    agent = models.OneToOneField(Agent, on_delete=models.CASCADE, related_name="active_session")
    event = models.OneToOneField(Event, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    def is_active(self):
        return self.ended_at is None
    

class WebUser(BaseAuditModel):

    AUDIT_IGNORE_FIELDS = ["is_email_verified", "date_joined","last_login","is_email_override"]
    role = models.ForeignKey(Role, on_delete=models.PROTECT, null=True)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=128)
    email = models.EmailField(unique=True)
    is_user_enabled = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)
    is_email_verified = models.BooleanField(default=False)
    is_email_override = models.BooleanField(default=False)
    @property
    def is_authenticated(self):
        return True
 
    @classmethod
    def get_available_roles(cls):
        """Get all unique roles currently in use"""
        return cls.objects.values_list('role', flat=True).distinct().order_by('role')
    
    def __str__(self):
        return f"{self.username} ({self.role})"


class Group(models.Model):
    user = models.ForeignKey(WebUser, on_delete=models.CASCADE,related_name="webuser")
    group_id=models.CharField(max_length=200)
    group_name = models.CharField(max_length=200)
    group_description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'group_name')
    
class GroupAgentAssignment(models.Model):
    """Just assign agents to groups with priority"""
    PRIORITY_CHOICES = [
        ('P1', 'Priority 1'),
        ('P2', 'Priority 2'), 
        ('P3', 'Priority 3'),
        ('P4', 'Priority 4'),
    ]
    
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='agent_assignments')
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='group_assignments')
    priority = models.CharField(max_length=2, choices=PRIORITY_CHOICES)
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('group', 'agent')


class ApplicationDiskIO(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    checkpoint = models.ForeignKey(MonitoringCheckpoint, on_delete=models.CASCADE, related_name='ApplicationDiskIO')
    storage = models.ForeignKey(Storage, on_delete=models.CASCADE, related_name='disk_io')
    name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=255,null=True) 
    pid = models.PositiveIntegerField()
    read_b_sec = models.BigIntegerField(default=0)  
    write_b_sec = models.BigIntegerField(default=0)  
    total_b_sec = models.BigIntegerField(default=0)  
    io_priority = models.PositiveSmallIntegerField(default=0)  
    response_time = models.FloatField(default=0.0)  
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (PID {self.pid}) on {self.storage.uuid}"
    
    class Meta:
        ordering = ['-read_b_sec']  
        verbose_name = "Application Disk I/O"
        verbose_name_plural = "Application Disk I/O"
        
class ApplicationMemoryIO(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    checkpoint = models.ForeignKey(MonitoringCheckpoint, on_delete=models.CASCADE, related_name='ApplicationMemoryIO')
    memory = models.ForeignKey(Memory, on_delete=models.CASCADE, related_name='processes')
    name = models.CharField(max_length=255) 
    pid = models.PositiveIntegerField() 
    commit_kb = models.BigIntegerField(default=0)
    working_set_kb = models.BigIntegerField(default=0)
    private_kb = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (PID {self.pid}) on Memory {self.memory.uuid}"
    class Meta:
        ordering = ['-working_set_kb']
        verbose_name = "Application Memory"
        verbose_name_plural = "Application Memory"


class ApplicationCPUIO(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    checkpoint = models.ForeignKey(MonitoringCheckpoint, on_delete=models.CASCADE, related_name='ApplicationCPUIO')
    cpu = models.ForeignKey(CPU, on_delete=models.CASCADE, related_name='processes')
    name = models.CharField(max_length=255) 
    pid = models.PositiveIntegerField()     
    status = models.CharField(max_length=50, default="running")
    threads = models.PositiveIntegerField(default=1)
    cpu_average = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (PID {self.pid}) on CPU {self.cpu.uuid}"

    class Meta:
        ordering = ['-cpu_average']
        verbose_name = "Application CPU"
        verbose_name_plural = "Application CPU"        