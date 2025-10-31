
from rest_framework.decorators import api_view
from rest_framework.response import Response
from BaseApp.services.webapp_services.alert_filter_services.helper_alert_service import AlertFilterService
import logging

def filtered_alerts_by_custom_range(request):
    """
    Filters alerts based on a custom time range.

    Parameters:
    alerts (list): A list of alert objects, each having a 'timestamp' attribute.
    start_time (datetime): The start time of the custom range.
    end_time (datetime): The end time of the custom range.

    Returns:
    list: A list of alerts that fall within the specified time range.
    """
    """
    Return alerts filtered by device, severity, type, time range, etc.
    Supports pagination via limit and offset.
    """
    # Extract parameters
    device_id = request.GET.get('device_id')
    severity = request.GET.get('severity')
    alert_type = request.GET.get('alert_type')
    time_range = request.GET.get('time_range')
    search_term = request.GET.get('search_term')
    
    # CUSTOM DATE RANGE PARAMETERS
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    limit = int(request.GET.get('limit', 200))
    offset = int(request.GET.get('offset', 0))
    
    # 🔍 DEBUG: Log incoming request
    
    service = AlertFilterService()
    data = service.filter_alerts(
        device_id=device_id,
        severity=severity,
        alert_type=alert_type,
        time_range=time_range,
        start_date=start_date, 
        end_date=end_date,   
        search_term=search_term,
        limit=limit,
        offset=offset,
    )
    
    return Response(data)



  