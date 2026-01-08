from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from BaseApp.utils import JWTCookieAuthentication
from BaseApp.models import Alert
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from BaseApp.serializer import AlertSerializer
import django_filters
from django.db.models import Q,OuterRef,Exists
import  logging
logger=logging.getLogger('agent_monitoring')

class Pagination(PageNumberPagination):
    page_size = 10  
    page_size_query_param = 'page_size'
    max_page_size = 100
    
@api_view(["GET"])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def get_latest_alert(request):
    """Retrieve the latest alerts for the dashboard."""
    try:
        filter_params=['severity','alert_type','device_name','start_date','uuid','end_date','search']
        
        has_filters = any(request.query_params.get(param) for param in filter_params)

        
        # Base queryset with read status annotation
        queryset = Alert.objects.select_related('agent').order_by('-created_at')
            
        if not has_filters:
            queryset=queryset[:200]
            
        filterset=AlertFilter(request.query_params, queryset=queryset)
        
        paginator=Pagination()
        page = paginator.paginate_queryset(filterset.qs, request)
        
        serializer = AlertSerializer(page, many=True)
        return paginator.get_paginated_response({'alerts':serializer.data})
   
    except Exception as e:
        import traceback
        print("="*50)
        print("FULL TRACEBACK:")
        traceback.print_exc()
        print("="*50)
        return Response({"error": str(e)}, status=500)
    
@api_view(["GET"])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def get_filter_options(request):
    """Retrieve filter options for alerts."""
    # Get distinct values and convert to set to ensure uniqueness
    try:
        
        queryset = Alert.objects.all()
        
        agent_uuid = request.query_params.get('uuid')
        if agent_uuid:
            queryset = queryset.filter(agent__uuid=agent_uuid)
            
        severities = set(queryset.values_list('severity', flat=True))
        types = set(queryset.values_list('alert_type', flat=True))
        device_names = set(queryset.values_list('device_name', flat=True))
            
        # Convert back to sorted lists
        return Response({
            'severity': sorted(list(severities)),
            'component': sorted(list(types)),
            'device': sorted(list(device_names))
        })
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
@api_view(["POST"])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def mark_alert_as_read(request):
    """Mark a specific alert as read for the current user."""
    try:
        alert_id=request.data.get('uuid')
        alert = Alert.objects.get(uuid=alert_id)
        # Add current user to read_by list
        alert.is_read=True
        alert.save()
       
        return Response({
            'success': True,
            'message': 'Alert marked as read'
        })
        
    except Alert.DoesNotExist:
        return Response({'error': 'Alert not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
@api_view(["POST"])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def mark_all_alerts_as_read(request):
    """Mark all alerts as read for the current user."""
    try:
        agent_uuid=request.query_params.get('uuid')
        # Get all unread alerts
        unread_alerts = Alert.objects.filter(is_read=False)
        
        if agent_uuid:
            unread_alerts=unread_alerts.filter(agent__uuid=agent_uuid)
        # Update all to read
        updated_count = unread_alerts.update(is_read=True)
        
        return Response({
            'success': True,
            'marked_read': updated_count
        })
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
@api_view(["GET"])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def get_unread_alert_count(request):
    """Get count of unread alerts for current user."""
    try:
        # Filter unread alerts
        unread_alerts = Alert.objects.filter(is_read=False)
        agent_uuid=request.query_params.get('uuid')
        
        if agent_uuid:
            unread_alerts=unread_alerts.filter(agent__uuid=agent_uuid)
        return Response({'unread_count': unread_alerts.count()})
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
class AlertFilter(django_filters.FilterSet):
    severity=django_filters.CharFilter(field_name='severity', lookup_expr='iexact')
    alert_type=django_filters.CharFilter(field_name='alert_type', lookup_expr='exact')
    device_name=django_filters.CharFilter(field_name='device_name', lookup_expr='iexact')
    start_date = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte',
    )
    
    end_date = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte',
    )
    search = django_filters.CharFilter(method='filter_search', label='Search All Fields')
    uuid=django_filters.CharFilter(field_name='agent__uuid',lookup_expr='exact')
    def filter_search(self, queryset, name, value):
        
        if not value:
            return queryset
        
        q_objects=(
            Q(device_name__icontains=value) |
            Q(alert_type__icontains=value) |
            Q(severity__icontains=value) | 
            Q(details__icontains=value)
        )
        return queryset.filter(q_objects)
    
    class Meta:
        model = Alert
        fields = ['severity', 'alert_type', 'device_name','uuid','created_at']    
     