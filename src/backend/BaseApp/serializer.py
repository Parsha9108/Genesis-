import email
import webbrowser
from rest_framework import serializers
from .models import Agent, Application
from rest_framework import serializers
from oauth2_provider.models import Application
from .models import Agent
from rest_framework import serializers
from django.core.validators import validate_ipv4_address, validate_ipv6_address
from .models import *
from django.contrib.auth.hashers import make_password

# CPU Serializer
class CPUSerializer(serializers.ModelSerializer):
    class Meta:
        model = CPU
        fields = ['uuid','make', 'model', 'p_cores', 'l_cores', 'speed']
    def validate(self, attrs):
        speed = attrs.get('speed')
        if speed is not None:
            attrs['speed'] = convert_speed(speed, "MHz")
        return attrs
    
# Memory Serializer
class MemorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Memory
        fields = ['uuid','make', 'model', 'speed', 'size', 'serial_number']
    def validate(self, attrs):
        speed = attrs.get('speed')
        size = attrs.get('size')

        if speed is not None:
            attrs['speed'] = convert_speed(speed, "MHz")
        if size is not None:
            attrs['size'] = convert_bytes_to_human_readable(size, "GB")
        return attrs
# Partition Serializer
class PartitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partition
        fields = ['uuid','name','serial_number', 'fs_type', 'free_space', 'used_space', 'total_size']

# Storage Serializer
class StorageSerializer(serializers.ModelSerializer):
    partition = PartitionSerializer(many=True)

    class Meta:
        model = Storage
        fields = ['uuid','hw_disk_type', 'make', 'model', 'serial_number', 'base_fs_type', 'free_space', 'total_disk_usage', 'total_disk_size','unallocated_disk_size','partition','is_flagged','flagged_at','flagged_reason']
        
    def create(self, validated_data):
        
        # Convertion of storage data into KB or MB or GB based on  bytes
        fields = ['free_space', 'total_disk_usage', 'total_disk_size','unallocated_disk_size']
        for field in fields:
           if field in validated_data:
                validated_data[field] = convert_bytes_to_human_readable(validated_data[field],"GB")

        partition_data = validated_data.pop('partition', [])

        # Convertion of partition data into KB or MB or GB based on  bytes
        partition_fields = ['free_space', 'used_space', 'total_size']
        storage = Storage.objects.create(**validated_data)
        for part in partition_data:
            for field in partition_fields:
                if field in part:
                    part[field] =convert_bytes_to_human_readable(part[field],"GB")
            Partition.objects.create(storage=storage, **part)
        return storage

# IP Address Serializer
class IPAddressSerializer(serializers.ModelSerializer):
    gateway = serializers.CharField(required=False)  
    def validate_gateway(self, value):
        if value.lower() == "unknown":
            return None  
        try:
            validate_ipv4_address(value)
            return value
        except serializers.ValidationError:
            try:
                validate_ipv6_address(value)
                return value
            except serializers.ValidationError:
                raise serializers.ValidationError("Enter a valid IPv4 or IPv6 address or use 'Unknown'.")

    class Meta:
        model = IPAddress
        fields = ['uuid','address', 'gateway', 'subnet_mask', 'dns']
#  Port Serializer
class PortSerializer(serializers.ModelSerializer):
    ip = IPAddressSerializer(many=True)
   
    class Meta:
        model = Port
        fields = ['uuid','interface_name', 'operating_speed', 'is_physical_logical', 'logical_type', 'ip']

    def create(self, validated_data):
        ip_data = validated_data.pop('ip', [])
        port = Port.objects.create(**validated_data)
        for ip in ip_data:
            IPAddress.objects.create(port=port, **ip)
        return port

#  NIC Serializer
class NICSerializer(serializers.ModelSerializer):
    port = PortSerializer(many=True)
    class Meta:
        model = NIC
        fields = ['uuid','make', 'model', 'number_of_ports', 'max_speed', 'supported_speeds','mac_address', 'serial_number', 'port']
    def validate(self, attrs):
        # Convert max_speed if it's present
        max_speed = attrs.get('max_speed')
        if max_speed is not None:
            attrs['max_speed'] = convert_bandwidth(max_speed)
        # Convert supported_speeds
        supported_speeds = attrs.get('supported_speeds')
        if supported_speeds:
            if isinstance(supported_speeds, str):
                speeds = supported_speeds.split(',')
            elif isinstance(supported_speeds, list):
                speeds = supported_speeds
            else:
                speeds = []

            converted = []
            for speed in speeds:
                speed_str = str(speed).strip()
                converted.append(convert_bandwidth(speed_str))
            attrs['supported_speeds'] = ", ".join(converted)

        return attrs
    def create(self, validated_data):
        port_data = validated_data.pop('port', [])
        for portdata in port_data:
            portdata['operating_speed'] = convert_bandwidth(portdata.get('operating_speed'))

        nic = NIC.objects.create(**validated_data)
        for p in port_data:
            PortSerializer().create({**p, 'nic': nic})
        return nic

#  GPU Serializer
class GPUSerializer(serializers.ModelSerializer):
    class Meta:
        model = GPU
        fields = ['uuid','make', 'model', 'serial_number', 'size', 'driver']
    def validate(self, attrs):
        size = attrs.get('size')
        if size is not None:
            attrs['size'] = convert_bytes_to_human_readable(size, "GB")
        return attrs
#  Device Serializer
class DeviceSerializer(serializers.ModelSerializer):
    cpu = CPUSerializer(many=True)
    memory = MemorySerializer(many=True)
    storage = StorageSerializer(many=True)
    nic = NICSerializer(many=True)
    gpu = GPUSerializer(many=True)

    class Meta:
        model = Device
        fields = ['uuid','make', 'model', 'serial_number', 'dev_phy_vm', 'cpu', 'memory', 'storage', 'nic', 'gpu']

    def create(self, validated_data):

        cpu_data = validated_data.pop('cpu', [])
        memory_data = validated_data.pop('memory', [])    
        storage_data = validated_data.pop('storage', [])
        nic_data = validated_data.pop('nic', [])
        gpu_data = validated_data.pop('gpu', [])
         
        device = Device.objects.create(**validated_data)

       
        CPU.objects.bulk_create([CPU(device=device, **cpu) for cpu in cpu_data])
        Memory.objects.bulk_create([Memory(device=device, **memory) for memory in memory_data])
        GPU.objects.bulk_create([GPU(device=device, **gpu) for gpu in gpu_data])
        
        for storage in storage_data:
            StorageSerializer().create({**storage, 'device': device})

        for nic in nic_data:
            NICSerializer().create({**nic, 'device': device})

        return device
class AgentSerializer(serializers.ModelSerializer):
    client_id = serializers.CharField(source="oauth_application.client_id", read_only=True)
    client_secret = serializers.SerializerMethodField()

    class Meta:
        model = Agent
        fields = ["uuid", "os","os_version","hostname","master_key", "client_id", "client_secret"]

    def create(self, validated_data):
    
        hostname = validated_data.get("hostname")
        os = validated_data.get("os")
        os_version = validated_data.get("os_version")
        master_key = validated_data.get("master_key")

        application = Application.objects.create(
            name=f"Agent-{hostname}",
            client_type=Application.CLIENT_CONFIDENTIAL,
            authorization_grant_type=Application.GRANT_CLIENT_CREDENTIALS,
            hash_client_secret = False
        )

        agent = Agent.objects.create(
            os=os,
            os_version = os_version,
            hostname=hostname,
            master_key=master_key,
            oauth_application=application
        )

        return agent
    
    
    
class EventSerializer(serializers.ModelSerializer):

    class Meta:
        model = Event
        fields =  '__all__'
        
        
class AlertSerializer(serializers.ModelSerializer):
    hostname = serializers.CharField(source='checkpoint.agent.hostname', read_only=True)
    class Meta:
        model = Alert
        fields = '__all__'

class CpuMonitoringSerializer(serializers.ModelSerializer):
    checkpoint = serializers.CharField(source='checkpoint.uuid', read_only=True)

    class Meta:
        model = CpuMonitoring
        fields = "__all__"

class MemoryMonitoringSerializer(serializers.ModelSerializer):
    checkpoint = serializers.CharField(source='checkpoint.uuid', read_only=True)

    class Meta:
        model = MemoryMonitoring
        fields = "__all__"
        
class DiskMonitoringSerializer(serializers.ModelSerializer):
    checkpoint = serializers.CharField(source='checkpoint.uuid', read_only=True)
    
    class Meta:
        model = DiskMonitoring
        fields = "__all__"
    

    
class WebUserSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True)
    role_name = serializers.CharField(source='role.role_name', read_only=True)
    class Meta:
        model = WebUser
        fields ='__all__' 
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'write_only': True},
        }
 
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return attrs
  
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        role = validated_data.get('role') 
        
        # Create user
        user = WebUser(**validated_data)
        user.password = make_password(validated_data['password']) 
        
        user.save()
        return user  

class WebLoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)   
    

class WebAgentSerializer(serializers.ModelSerializer):
    device = DeviceSerializer(read_only=True)
    monitoring_data = serializers.SerializerMethodField()  

    class Meta:
        model = Agent
        fields = ["uuid", "os", "os_version", "hostname", "device","status","uptime_started_at", "last_activated_at","last_seen","monitoring_data","last_uptime_duration"]  

    def get_monitoring_data(self, obj):
        events = obj.event_set.all().order_by('-created_at')[:100]
        checkpoint_uuids = obj.checkpoints.values_list('uuid', flat=True)
        alerts = Alert.objects.filter(checkpoint_id__in=checkpoint_uuids).order_by('-created_at')
        return {
            "events": EventSerializer(events, many=True).data,
            "alerts": AlertSerializer(alerts, many=True).data,
        }
        
        
from rest_framework import serializers
from .models import Group, GroupAgentAssignment, Agent, WebUser

class Deviceserializer(serializers.ModelSerializer):
    """Serializer for Agent/Device data in groups"""
    class Meta:
        model = Agent
        fields = ['uuid', 'hostname', 'status', 'os', 'os_version', 'last_seen']

class GroupAgentAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for group-agent assignments with device details"""
    agent = Deviceserializer(read_only=True)
    
    class Meta:
        model = GroupAgentAssignment
        fields = ['agent', 'priority', 'added_at']

class GroupSerializer(serializers.ModelSerializer):
    """Serializer for Group with nested devices"""
    devices = GroupAgentAssignmentSerializer(source='agent_assignments', many=True, read_only=True)
    device_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = ['group_id', 'group_name', 'group_description', 'created_at', 'device_count', 'devices']
    
    def get_device_count(self, obj):
        return obj.agent_assignments.count()

class UserGroupsSerializer(serializers.Serializer):
    """Complete serializer for user with all their groups"""
    user = serializers.SerializerMethodField()
    groups = GroupSerializer(many=True)
    total_groups = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(read_only=True)
    
    def get_user(self, obj):
        user = self.context['request'].user
        return {
            'id': str(user.id),
            'username': user.username,
            'email': user.email
        }
    
    def get_total_groups(self, obj):
        return len(obj['groups']) if isinstance(obj, dict) and 'groups' in obj else obj.count()

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebUser
        fields = ['username', 'email','password','role','is_active','is_email_enabled']
    
    def validate_username(self, value):
        """Validate username uniqueness"""
        if value:
            # Check if username already exists for other users
            if WebUser.objects.filter(username=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_email(self, value):
        """Validate email format and uniqueness"""
        if value:
            # Check if email already exists for other users
            if WebUser.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("This email is already in use.")
        return value

    def update(self, instance, validated_data):
        """Update only the fields that are provided"""
        for attr, value in validated_data.items():
            if value is not None:  # Update if value is provided (including empty role)
                setattr(instance, attr, value)
        
        instance.save()
        return instance

class WebLoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)   
    

class WebAgentSerializer(serializers.ModelSerializer):
    device = DeviceSerializer(read_only=True)
    monitoring_data = serializers.SerializerMethodField()  

    class Meta:
        model = Agent
        fields = ["uuid", "os", "os_version", "hostname", "device","status","uptime_started_at", "last_activated_at","last_seen","last_uptime_duration","monitoring_data"]  

    def get_monitoring_data(self, obj):
        events = obj.event_set.all().order_by('-created_at')[:100]
        checkpoint_uuids = obj.checkpoints.values_list('uuid', flat=True)
        alerts = Alert.objects.filter(checkpoint_id__in=checkpoint_uuids).order_by('-created_at')
        return {
            "events": EventSerializer(events, many=True).data,
            "alerts": AlertSerializer(alerts, many=True).data,
        }
        

class Deviceserializer(serializers.ModelSerializer):
    """Serializer for Agent/Device data in groups"""
    dev_phy_vm = serializers.SerializerMethodField()
    ip_address = serializers.SerializerMethodField()

    class Meta:
        model = Agent
        fields = ['uuid','hostname','status','os','os_version','dev_phy_vm','ip_address',]

    def get_dev_phy_vm(self, obj):
        if obj.device:
            return obj.device.dev_phy_vm
        return None

    def get_ip_address(self, obj):
        if obj.device and obj.device.nic.exists():
            for nic in obj.device.nic.all():
                for port in nic.port.all():
                    for ip in port.ip.all():
                        if ip.gateway and ip.gateway != "0.0.0.0":
                            return ip.address   
        return None

    
class GroupAgentAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for group-agent assignments with device details"""
    agent = Deviceserializer(read_only=True)
    
    class Meta:
        model = GroupAgentAssignment
        fields = ['agent', 'priority', 'added_at']

class GroupSerializer(serializers.ModelSerializer):
    """Serializer for Group with nested devices"""
    devices = GroupAgentAssignmentSerializer(source='agent_assignments', many=True, read_only=True)
    device_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = ['group_id', 'group_name', 'group_description', 'created_at', 'device_count', 'devices']
    
    def get_device_count(self, obj):
        return obj.agent_assignments.count()

class UserGroupsSerializer(serializers.Serializer):
    """Complete serializer for user with all their groups"""
    user = serializers.SerializerMethodField()
    groups = GroupSerializer(many=True)
    total_groups = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(read_only=True)
    
    def get_user(self, obj):
        user = self.context['request'].user
        return {
            'id': str(user.id),
            'username': user.username,
            'email': user.email
        }
    
    def get_total_groups(self, obj):
        return len(obj['groups']) if isinstance(obj, dict) and 'groups' in obj else obj.count()
    
class DeviceNICSerializer(serializers.ModelSerializer):
    nic = NICSerializer(many=True) 
    class Meta:
        model = Device
        fields = [ 'nic']   
    
class AvailableWebAgentSerializer(serializers.ModelSerializer):
    device = DeviceNICSerializer(read_only=True)
    class Meta:
        model = Agent
        fields = ["uuid", "os", "os_version", "hostname", "device","status","uptime_started_at"]  
class RoleSerializer(serializers.ModelSerializer):
    """
    Serializer for Role model
    Basic role details without permissions
    """
    
    class Meta:
        model = Role
        fields = ['role_name']

class PermissionSetSerializer(serializers.ModelSerializer):
    """
    Serializer for PermissionSet model
    Handles individual permission records
    """
    
    class Meta:
        model = PermissionSet
        fields =[
            'module',
            'create',
            'read',
            'update',
            'delete'
        ]

class RoleListSerializer(serializers.ModelSerializer):
    """
    Role list serializer with permission details
    Returns role with complete permission set
    """
    permissions = PermissionSetSerializer(
        source='permissionset_set',
        many=True,
        read_only=True
    )

    class Meta:
        model = Role
        fields = [
            'uuid',
            'role_name',
            'permissions'
        ]


class PermissionSetCreateSerializer(serializers.Serializer):
    """
    Serializer for creating permissions in bulk
    Used when creating/updating roles with permissions
    """
    # Define fields explicitly (not model/fields like ModelSerializer)
    module = serializers.ChoiceField(
        choices=[m[0] for m in PermissionSet.modules]
    )
    create = serializers.BooleanField(required=False, default=False)
    read = serializers.BooleanField(required=False, default=False)
    update = serializers.BooleanField(required=False, default=False)
    delete = serializers.BooleanField(required=False, default=False)
    
    def validate_module(self, value):
        """Validate module is valid"""
        valid_modules = [m[0] for m in PermissionSet.modules]
        if value not in valid_modules:
            raise serializers.ValidationError(
                f"Invalid module. Choose from: {', '.join(valid_modules)}"
            )
        return value
    
    def validate(self, data):
        """Validate at least one permission is set"""
        has_any_permission = any([
            data.get('create', False),
            data.get('read', False),
            data.get('update', False),
            data.get('delete', False)
        ])
        
        
        return data

class RoleCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating roles with permissions
    Handles nested permission creation/update
    """
    permissions = PermissionSetCreateSerializer(
        many=True,
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Role
        fields = [
            'uuid',
            'role_name',
            'permissions'
        ]
        read_only_fields = ['uuid']
        extra_kwargs = {
            'role_name': {'required': False}  # Make optional for partial updates
        }
    
    def validate_role_name(self, value):
        """Validate role name"""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError(
                "Role name cannot be empty"
            )
        
        # Check for duplicate
        instance = self.instance
        query = Role.objects.filter(role_name__iexact=value)
        
        if instance:
            # Exclude current role when checking for duplicates
            query = query.exclude(uuid=instance.uuid)
        
        if query.exists():
            raise serializers.ValidationError(
                f"Role with name '{value}' already exists"
            )
        
        return value
    
    def validate_permissions(self, value):
        """Validate permissions list"""
        if not value:
            return value
        
        # Ensure it's a list
        if not isinstance(value, list):
            raise serializers.ValidationError("Permissions must be a list")
        
        # Check for duplicate modules
        modules = [perm.get('module') for perm in value]
        if len(modules) != len(set(modules)):
            raise serializers.ValidationError(
                "Duplicate modules in permissions"
            )
        
        return value
    
    def create(self, validated_data):
        """Create role with nested permissions"""
        try:
            # Extract permissions from validated_data
            permissions_data = validated_data.pop('permissions', [])
            
            # Create role
            role = Role.objects.create(**validated_data)
            
            # Create permissions
            for perm_data in permissions_data:
                PermissionSet.objects.create(
                    role=role,
                    module=perm_data['module'],
                    create=perm_data.get('create', False),
                    read=perm_data.get('read', False),
                    update=perm_data.get('update', False),
                    delete=perm_data.get('delete', False)
                )
            
            return role
        except Exception as e:
            # Rollback if creation fails
            if 'role' in locals():
                role.delete()
            raise serializers.ValidationError(f"Failed to create role: {str(e)}")
    
    def update(self, instance, validated_data):
        """
        Update role and/or its permissions
        - If role_name provided: update role name
        - If permissions provided: update permissions
        """
        try:
            # Extract permissions from validated_data
            permissions_data = validated_data.pop('permissions', None)
            
            # Update role name only if provided
            if 'role_name' in validated_data:
                instance.role_name = validated_data['role_name']
                instance.save()
            
            # Update permissions only if provided
            if permissions_data is not None:
                # Ensure it's a list
                if not isinstance(permissions_data, list):
                    raise serializers.ValidationError("Permissions must be a list")
                
                # Delete existing permissions
                instance.permissionset_set.all().delete()
                
                # Create new permissions
                for perm_data in permissions_data:
                    PermissionSet.objects.create(
                        role=instance,
                        module=perm_data.get('module'),
                        create=perm_data.get('create', False),
                        read=perm_data.get('read', False),
                        update=perm_data.get('update', False),
                        delete=perm_data.get('delete', False)
                    )
            
            return instance
        except Exception as e:
            raise serializers.ValidationError(f"Failed to update role: {str(e)}")

