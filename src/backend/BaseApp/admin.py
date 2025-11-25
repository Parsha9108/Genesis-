from django.contrib import admin
from .models.models import *
from .models.roles import *
from .models.global_config import *
admin.site.register(Agent)
admin.site.register(Device)
admin.site.register(CPU)
admin.site.register(GPU)
admin.site.register(Memory)
admin.site.register(Storage)
admin.site.register(Partition)
admin.site.register(NIC)
admin.site.register(Port)
admin.site.register(IPAddress)
admin.site.register(Event)
admin.site.register(CpuMonitoring)
admin.site.register(MemoryMonitoring)
admin.site.register(DiskMonitoring)
admin.site.register(PartitionMonitoring)
admin.site.register(NetworkPortMonitoring)
admin.site.register(Alert)
admin.site.register(WebUser)
admin.site.register(PendingDeletion)
admin.site.register(MonitoringSession)
admin.site.register(Group)
admin.site.register(GroupAgentAssignment)
admin.site.register(Permission)
admin.site.register(UserPermission)
admin.site.register(ApplicationCPUIO)
admin.site.register(ApplicationMemoryIO)
admin.site.register(ApplicationDiskIO)
admin.site.register(Role)
admin.site.register(PermissionSet)
admin.site.register(GlobalConfig)


@admin.register(MonitoringCheckpoint)
class MonitoringCheckpointAdmin(admin.ModelAdmin):
    # 1. Point to the custom method name instead of the field name
    list_display = ('agent__uuid', 'agent__hostname', 'display_created_at')
    
    # 2. Use a tuple for filters
    search_fields = ('agent__uuid', 'agent__hostname',) 
    list_filter = ('agent',)

    # 3. Define the custom method
    def display_created_at(self, obj):
        # Format: YYYY-MM-DD HH:MM:SS
        return obj.created_at.strftime("%Y-%m-%d %H:%M:%S")
    
    # 4. Configure the column headers and sorting
    display_created_at.admin_order_field = 'created_at'  # Keeps the column sortable
    display_created_at.short_description = 'Created At'  # Sets the column header name
