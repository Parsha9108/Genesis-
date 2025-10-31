# BaseApp/services/webapp_services/user_permissions/update_user_permissions.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from BaseApp.models import WebUser, Permission, UserPermission
import logging

def update_user_permissions(request, userId):
    """Update user permissions using your custom models"""
    try:
        permissions = request.data.get('permissions', [])
        print(f"Updating permissions for user ID: {userId}")
        print(f"Permissions to set: {permissions}")
        
        with transaction.atomic():
            # Get WebUser
            try:
                target_user = WebUser.objects.get(id=userId)
                print(f"Found WebUser: {target_user.username}")
            except WebUser.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get current active permissions
            current_permissions = set(
                UserPermission.objects.filter(user=target_user, is_active=True)
                .values_list('permission_id', flat=True)
            )
            new_permissions = set(permissions)
            
         
            
            # Calculate changes
            permissions_to_add = new_permissions - current_permissions
            permissions_to_remove = current_permissions - new_permissions
            
            
            
            # Deactivate permissions that are no longer selected
            removed_count = 0
            if permissions_to_remove:
                updated = UserPermission.objects.filter(
                    user=target_user,
                    permission_id__in=permissions_to_remove,
                    is_active=True
                ).update(is_active=False)
                removed_count = updated
               
            
            # Add new permissions
            added_count = 0
            invalid_permissions = []
            
            for perm_id in permissions_to_add:
                try:
                    permission = Permission.objects.get(id=perm_id)
                    
                    
                    # ✅ FIX: Check if UserPermission already exists first
                    try:
                        user_perm = UserPermission.objects.get(
                            user=target_user,
                            permission=permission
                        )
                        # If it exists but is inactive, reactivate it
                        if not user_perm.is_active:
                            user_perm.is_active = True
                            user_perm.granted_by = None  # Set this properly based on your auth
                            user_perm.save()
                            added_count += 1
                            print(f"Reactivated permission: {permission.name}")
                        else:
                            print(f"Permission already active: {permission.name}")
                            
                    except UserPermission.DoesNotExist:
                        # ✅ FIX: Create new UserPermission with explicit field assignment
                        user_perm = UserPermission(
                            user=target_user,
                            permission=permission,
                            granted_by=None,  # Set this based on your auth system
                            is_active=True
                        )
                        user_perm.save()
                        added_count += 1
                        print(f"Created new permission: {permission.name}")
                    
                except Permission.DoesNotExist:
                    invalid_permissions.append(perm_id)
                    print(f"Permission with ID {perm_id} not found")
                except Exception as e:
                    print(f"Error adding permission {perm_id}: {str(e)}")
                    invalid_permissions.append(perm_id)
            
            # Get final active permission count
            final_count = UserPermission.objects.filter(user=target_user, is_active=True).count()
            
            response_data = {
                'success': True,
                'message': f'Permissions updated for user {target_user.username}',
                'user_id': str(userId),
                'username': target_user.username,
                'permissions_added': added_count,
                'permissions_removed': removed_count,
                'total_permissions': final_count
            }
            
            # Add warning if some permissions were invalid
            if invalid_permissions:
                response_data['warning'] = f'Some permissions not found: {invalid_permissions}'
                response_data['invalid_permissions'] = invalid_permissions
            
            return Response(response_data)
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
