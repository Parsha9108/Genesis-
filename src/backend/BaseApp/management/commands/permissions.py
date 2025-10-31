# management/commands/init_permissions.py
from django.core.management.base import BaseCommand
from django.db import transaction
from BaseApp.models import Permission, WebUser, UserPermission

class Command(BaseCommand):
    help = 'Initialize all permissions and assign default permissions to roles'
     
    def handle(self, *args, **options):
        permissions_data = [
            # User Management Permissions
            {
                'name': 'view_users',
                'description': 'View user list and profiles',
                'category': 'user_management'
            },
            {
                'name': 'create_user',
                'description': 'Create new users',
                'category': 'user_management'
            },
            {
                'name': 'edit_user',
                'description': 'Edit user profiles and information',
                'category': 'user_management'
            },
            {
                'name': 'delete_user',
                'description': 'Delete users from system',
                'category': 'user_management'
            },
            {
                'name': 'manage_permissions',
                'description': 'Assign and revoke user permissions',
                'category': 'user_management'
            },
            {
                'name': 'reset_user_password',
                'description': 'Reset passwords for users',
                'category': 'user_management'
            },

            # Group Management Permissions
           {
                'name': 'access_custom_group_feature',
                'description': 'Allow viewing, creating, editing, and deleting custom device groups',
                'category': 'group_management'
            },
            {
                'name': 'view_groups',
                'description': 'View device groups and their details',
                'category': 'group_management'
            },
            {
                'name': 'create_groups',
                'description': 'Create new device groups',
                'category': 'group_management'
            },
            {
                'name': 'edit_groups',
                'description': 'Modify existing device groups',
                'category': 'group_management'
            },
            {
                'name': 'delete_groups',
                'description': 'Remove device groups',
                'category': 'group_management'
            },
            {
                'name': 'assign_devices_to_groups',
                'description': 'Add or remove devices from groups',
                'category': 'group_management'
            },

            # # Device Management Permissions
            # {
            #     'name': 'view_devices',
            #     'description': 'View device list and information',
            #     'category': 'device_management'
            # },
            # {
            #     'name': 'add_devices',
            #     'description': 'Add new devices to monitoring',
            #     'category': 'device_management'
            # },
            # {
            #     'name': 'edit_devices',
            #     'description': 'Modify device settings and configuration',
            #     'category': 'device_management'
            # },
            # {
            #     'name': 'delete_devices',
            #     'description': 'Remove devices from monitoring',
            #     'category': 'device_management'
            # },
            # {
            #     'name': 'device_remote_actions',
            #     'description': 'Perform remote actions on devices (restart, etc.)',
            #     'category': 'device_management'
            # },

            # Monitoring Permissions
            {
                'name': 'view_monitoring_dashboard',
                'description': 'Access monitoring dashboards',
                'category': 'monitoring'
            },
            {
                'name': 'view_device_metrics',
                'description': 'View detailed device performance metrics',
                'category': 'monitoring'
            },
            {
                'name': 'export_monitoring_data',
                'description': 'Export monitoring data and reports',
                'category': 'monitoring'
            },
            {
                'name': 'configure_monitoring_settings',
                'description': 'Configure monitoring thresholds and settings',
                'category': 'monitoring'
            },

            # Alert Management Permissions
            {
                'name': 'view_alerts',
                'description': 'View alert notifications and history',
                'category': 'alerts'
            },
            # {
            #     'name': 'manage_alert_rules',
            #     'description': 'Create and modify alert rules',
            #     'category': 'alerts'
            # },
            # {
            #     'name': 'acknowledge_alerts',
            #     'description': 'Acknowledge and resolve alerts',
            #     'category': 'alerts'
            # },
            {
                'name': 'receive_email_alerts',
                'description': 'Receive alert notifications via email',
                'category': 'alerts'
            },
            {
                'name': 'receive_sms_alerts',
                'description': 'Receive critical alerts via SMS',
                'category': 'alerts'
            },

            # # Report Management Permissions
            # {
            #     'name': 'view_reports',
            #     'description': 'View system reports and analytics',
            #     'category': 'reports'
            # },
            # {
            #     'name': 'create_custom_reports',
            #     'description': 'Create custom reports and dashboards',
            #     'category': 'reports'
            # },
            # {
            #     'name': 'schedule_reports',
            #     'description': 'Schedule automatic report generation',
            #     'category': 'reports'
            # },
            # {
            #     'name': 'export_reports',
            #     'description': 'Export reports in various formats',
            #     'category': 'reports'
            # },

            # System Administration Permissions
            {
                'name': 'view_settings',
                'description': 'View system configuration settings',
                'category': 'system_admin'
            },
            {
                'name': 'view_sessions',
                'description': 'View active user sessions',
                'category': 'system_admin'
            },
            {
                'name': 'view_audit_logs',
                'description': 'View system audit logs',
                'category': 'system_admin'
            },
            # {
            #     'name': 'backup_system',
            #     'description': 'Create system backups',
            #     'category': 'system_admin'
            # },
            # {
            #     'name': 'restore_system',
            #     'description': 'Restore system from backups',
            #     'category': 'system_admin'
            # },

           
        ]

        with transaction.atomic():
            created_count = 0
            for perm_data in permissions_data:
                permission, created = Permission.objects.get_or_create(
                    name=perm_data['name'],
                    defaults={
                        'description': perm_data['description'],
                        'category': perm_data['category']
                    }
                )
                if created:
                    created_count += 1
                    self.stdout.write(f"✓ Created permission: {permission.name}")

            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully initialized {created_count} permissions'
                )
            )

            # ✅ Assign default permissions to existing users
            self.assign_default_permissions()

    def assign_default_permissions(self):
        """Assign default permissions based on user roles"""
        
        # Define default permissions for each role
        role_permissions = {
            'user': [
                'view_devices', 'view_monitoring_dashboard', 'view_device_metrics',
                'view_alerts', 'acknowledge_alerts', 'view_reports',
                'receive_email_alerts'
            ],
            'manager': [
                'view_users', 'view_devices', 
                'view_groups', 'create_groups', 'edit_groups', 'assign_devices_to_groups',
                'view_monitoring_dashboard', 'view_device_metrics', 'export_monitoring_data',
                'view_alerts', 'manage_alert_rules', 'acknowledge_alerts',
                'view_reports', 'export_reports',
                'receive_email_alerts', 'receive_sms_alerts'
            ],
            # Note: Admin gets all permissions by default in code, no need to assign
        }

        for role, permission_names in role_permissions.items():
            users = WebUser.objects.filter(role=role)
            permissions = Permission.objects.filter(name__in=permission_names)
            
            for user in users:
                for permission in permissions:
                    UserPermission.objects.get_or_create(
                        user=user,
                        permission=permission,
                        defaults={'is_active': True}
                    )
            
            self.stdout.write(f"✓ Assigned {len(permission_names)} permissions to {users.count()} {role} users")
