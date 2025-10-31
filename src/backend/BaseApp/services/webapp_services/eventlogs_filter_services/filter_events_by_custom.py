
from rest_framework.response import Response
from BaseApp.services.webapp_services.eventlogs_filter_services.helper_eventlog_service import EventLogFilterService
import logging
def filtered_eventlogs_by_custom_range(request):
    """Filter event logs using the existing Event model."""
    
    # Extract parameters
    device_id = request.GET.get('device_id')
    event_type = request.GET.get('event_type')
    component_type = request.GET.get('component_type')
    time_range = request.GET.get('time_range')
    search_term = request.GET.get('search_term')
    
    # Extract custom date range parameters
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    limit = int(request.GET.get('limit', 200))
    offset = int(request.GET.get('offset', 0))
    
    
    service = EventLogFilterService()
    data = service.filter_eventlogs(
        device_id=device_id,
        event_type=event_type,
        component_type=component_type,
        time_range=time_range,
        search_term=search_term,
        start_date=start_date,  
        end_date=end_date,    
        limit=limit,
        offset=offset,
    )
    
    return Response(data)
