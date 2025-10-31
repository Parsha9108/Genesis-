from rest_framework.response import Response
from BaseApp.services.webapp_services.eventlogs_filter_services.helper_eventlog_service import EventLogFilterService


def filtered_events_by_option(request):
    """Get filter options for event logs."""
    device_id = request.GET.get('device_id')
    
    service = EventLogFilterService()
    data = service.get_filter_options(device_id)
    
    return Response(data)
