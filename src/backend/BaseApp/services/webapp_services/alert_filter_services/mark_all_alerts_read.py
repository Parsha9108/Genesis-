from rest_framework.response import Response
from rest_framework import status
from ....models import Alert

def make_all_alerts_as_read(request):
    """Mark multiple alerts as read."""
    try:
        alert_ids = request.data.get('alert_ids', [])
        
        if not alert_ids or not isinstance(alert_ids, list):
            return Response(
                {'error': 'alert_ids must be a non-empty list'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update all alerts in a single query
        updated_count = Alert.objects.filter(
            uuid__in=alert_ids
        ).update(is_read=True)
        
        
        return Response({
            'success': True,
            'message': f'{updated_count} alerts marked as read',
            'updated_count': updated_count,
            'alert_ids': alert_ids
        })
        
    except Exception as e:
        return Response(
            {'error': 'Failed to mark alerts as read'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
