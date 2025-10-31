# views.py - Permission Management

from rest_framework.response import Response
from rest_framework import status
from ....models import WebUser, Permission, UserPermission
def get_available_permissions(request):
    """Get all available permissions grouped by category"""

    permissions = Permission.objects.all().order_by('category', 'name')
    
    # Group by category
    grouped_permissions = {}
    for permission in permissions:
        category = permission.category
        if category not in grouped_permissions:
            grouped_permissions[category] = []
        
        grouped_permissions[category].append({
            'id': permission.id,
            'name': permission.name,
            'description': permission.description
        })
    return Response(grouped_permissions)