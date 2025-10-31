from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from ....models import Alert

def make_alerts_as_read(request):
    """Mark a single alert as read."""
    try:
        alert_id = request.data.get('alert_id')
        
        if not alert_id:
            return Response(
                {'error': 'alert_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the alert and mark as read
        alert = get_object_or_404(Alert, uuid=alert_id)
        alert.mark_as_read()
    
        return Response({
            'success': True,
            'message': 'Alert marked as read',
            'alert_id': str(alert.uuid)
        })
        
    except Exception as e:
        return Response(
            {'error': 'Failed to mark alert as read'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    