from rest_framework.response import Response
from BaseApp.services.webapp_services.alert_filter_services.helper_alert_service import AlertFilterService

def filtered_alerts_by_options(request):
    """
    Return available filter dropdown options (severity, alert_type, time_range).
    """
    device_id = request.GET.get('device_id')
    
    service = AlertFilterService()
    data = service.get_filter_options(device_id)
    
    return Response(data)