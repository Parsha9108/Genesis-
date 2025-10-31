from rest_framework.response import Response
from ....models import WebUser, Permission, UserPermission
from rest_framework import status

def get_user_permissions(request, userId):
    """Get current permissions for a specific user"""
    
    if request.user.role != 'admin' and str(request.user.id) != str(userId):    
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = WebUser.objects.get(id=userId)
        user_permissions = UserPermission.objects.filter(user=user, is_active=True)
        
        permissions_data = []
        for up in user_permissions:
            permissions_data.append({
                'id': up.permission.id,
                'name': up.permission.name,
                'description': up.permission.description,
                'category': up.permission.category,
                'granted_by': up.granted_by.username if up.granted_by else None,
                'granted_at': up.granted_at
            })
        return Response({
            'user': user.username,
            'role': user.role,
            'permissions': permissions_data
        })
        
    except WebUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
