
from rest_framework.response import Response
from rest_framework import status
from ....models import Alert

def get_unread_alerts_count(request):
    """Get count of unread alerts for current user."""
    try:
        # You might want to filter by user's accessible devices
        unread_count = Alert.objects.filter(is_read=False).count()
        
        return Response({
            'unread_count': unread_count
        })
        
    except Exception as e:
        return Response(
            {'error': 'Failed to get unread count'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )    