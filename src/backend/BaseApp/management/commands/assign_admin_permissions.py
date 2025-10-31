# BaseApp/management/commands/assign_admin_permissions.py
from django.core.management.base import BaseCommand
from django.db import transaction
from BaseApp.models import WebUser, Permission, UserPermission

class Command(BaseCommand):
    help = 'Assign all permissions to admin users'

    def handle(self, *args, **options):
        with transaction.atomic():
            # Get all admin users
            admin_users = WebUser.objects.filter(role='admin')
            
            # Get all available permissions
            all_permissions = Permission.objects.filter()
            
            for admin_user in admin_users:
                # Get existing permissions
                existing_permissions = set(
                    UserPermission.objects.filter(user=admin_user, is_active=True)
                    .values_list('permission_id', flat=True)
                )
                print(f'Existing permissions for {admin_user.username}: {existing_permissions}')
#             fail_silently=False,
                # Create missing permissions
                new_permissions = []
                for permission in all_permissions:
                    if permission.id not in existing_permissions:
                        new_permissions.append(
                            UserPermission(
                                user=admin_user,
                                permission=permission,
                                granted_by=None,
                            )
                        )
                print(f'New permissions to add for {admin_user.username}: {[p.permission.id for p in new_permissions]}')    
                if new_permissions:
                    UserPermission.objects.bulk_create(new_permissions, ignore_conflicts=True)
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✅ Assigned {len(new_permissions)} permissions to admin user: {admin_user.username}'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'ℹ️ Admin user {admin_user.username} already has all permissions'
                        )
                    )
            
            self.stdout.write(
                self.style.SUCCESS(f'✅ Processed {admin_users.count()} admin users')
            )

# Run with: python manage.py assign_admin_permissions
