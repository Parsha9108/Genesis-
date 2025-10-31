import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from django.utils import timezone
from django.db.models import Q
from django.conf import settings
from dateutil import parser as date_parser  # ✅ ADD THIS IMPORT
from ....models import Event

logger = logging.getLogger("eventlog_filtering")

# Load configuration from Django settings
EVENTLOG_FILTER_CONFIG = getattr(settings, 'EVENTLOG_FILTER_CONFIG', {})
DEFAULT_LIMIT = EVENTLOG_FILTER_CONFIG.get('DEFAULT_LIMIT', 200)
MAX_LIMIT = EVENTLOG_FILTER_CONFIG.get('MAX_LIMIT', 5000)
SLOW_QUERY_THRESHOLD = EVENTLOG_FILTER_CONFIG.get('SLOW_QUERY_THRESHOLD', 2.0)


class EventLogFilterService:
    """Service for filtering event logs for a specific device with safe handling."""

    def __init__(self):
        self._query_stats = {
            'total_queries': 0,
            'slow_queries': 0,
            'errors': 0,
        }

    # ======================== MAIN FILTER FUNCTION ========================
    def  filter_eventlogs(
        self,
        device_id: Optional[str] = None,
        event_type: Optional[str] = None,
        component_type: Optional[str] = None,
        time_range: Optional[str] = None,
        search_term: Optional[str] = None,
        start_date: Optional[str] = None,    # ✅ Added for custom range
        end_date: Optional[str] = None,      # ✅ Added for custom range
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """Return filtered event logs, limited and paginated."""
        import time
        start_time = time.time()

        try:
            self._query_stats['total_queries'] += 1
            limit = min(max(1, limit or DEFAULT_LIMIT), MAX_LIMIT)

            # 🔍 DEBUG: Log received parameters
            logger.info(f"[EventLogFilterService] Received params - start_date: {start_date}, end_date: {end_date}")

            queryset = Event.objects.select_related('agent', 'agent__device').order_by('-created_at')

            # ✅ Filter by device UUID
            if device_id:
                logger.info(f"[EventLogFilterService] Filtering events for device: {device_id}")
                queryset = queryset.filter(agent__device__uuid=str(device_id))

            # Filter by event type
            if event_type and event_type.lower() != "all":
                queryset = queryset.filter(event_type=event_type)

            # Filter by component
            if component_type and component_type.lower() != "all":
                queryset = queryset.filter(component_type=component_type)

            # ✅ Handle custom start_date and end_date from frontend (UPDATED WITH dateutil)
            if start_date and end_date:
                try:
                    # Use dateutil to handle ISO strings with 'Z' timezone indicator
                    start = date_parser.isoparse(start_date)
                    end = date_parser.isoparse(end_date)
                    queryset = queryset.filter(created_at__range=(start, end))
                    logger.info(f"[EventLogFilterService] ✅ Custom range filter applied: {start} to {end}")
                    logger.info(f"[EventLogFilterService] Queryset count after filter: {queryset.count()}")
                except Exception as e:
                    logger.warning(f"[EventLogFilterService] ❌ Invalid custom range: {start_date}, {end_date} - Error: {e}")

            # Apply predefined (relative) time ranges
            elif time_range and time_range.lower() != "all":
                time_filter = self._get_time_filter(time_range)
                if time_filter:
                    queryset = queryset.filter(time_filter)

            # Search term
            if search_term:
                queryset = queryset.filter(
                    Q(description__icontains=search_term)
                    | Q(event_type__icontains=search_term)
                    | Q(component_type__icontains=search_term)
                )

            # Pagination & processing
            total_count = queryset.count()
            paginated_queryset = queryset[offset:offset + limit]

            # Serialize results
            results = []
            for event in paginated_queryset:
                device_name = "Unknown"
                device_uuid = None
                if event.agent and getattr(event.agent, "device", None):
                    device_obj = event.agent.device
                    device_name = getattr(device_obj, "name", f"Device-{device_obj.uuid}")
                    device_uuid = str(device_obj.uuid)

                results.append({
                    "uuid": str(getattr(event, "uuid", event.id)),
                    "agent_id": str(event.agent.uuid) if event.agent else None,
                    "device_uuid": device_uuid,
                    "device_name": device_name,
                    "event_type": event.event_type,
                    "component_type": event.component_type or "System",
                    "description": event.description,
                    "created_at": event.created_at.isoformat(),
                })

            # Log slow queries
            processing_time = time.time() - start_time
            if processing_time > SLOW_QUERY_THRESHOLD:
                logger.warning(f"[EventLogFilterService] Slow query ({processing_time:.2f}s)")

            return {
                "results": results,
                "count": total_count,
                "limit": limit,
                "offset": offset,
                "has_next": offset + limit < total_count,
                "has_previous": offset > 0,
                "processing_time": processing_time,
                "filters_applied": {
                    "device_id": device_id,
                    "event_type": event_type,
                    "component_type": component_type,
                    "time_range": time_range,
                    "start_date": start_date,
                    "end_date": end_date,
                    "search_term": search_term,
                },
            }

        except Exception as e:
            self._query_stats['errors'] += 1
            logger.exception(f"[EventLogFilterService] Error while filtering event logs: {e}")
            return {
                "results": [],
                "count": 0,
                "limit": limit,
                "offset": offset,
                "error": str(e),
            }

    # ======================== FILTER OPTIONS ========================
    def get_filter_options(self, device_id: Optional[str] = None) -> Dict[str, List[str]]:
        """Return available filter dropdown options."""
        try:
            queryset = Event.objects.all()
            if device_id:
                queryset = queryset.filter(agent__device__uuid=str(device_id))

            event_types = list(
                queryset.exclude(event_type__isnull=True)
                .exclude(event_type__exact="")
                .values_list("event_type", flat=True)
                .distinct()
                .order_by("event_type")
            )

            component_types = list(
                queryset.exclude(component_type__isnull=True)
                .exclude(component_type__exact="")
                .values_list("component_type", flat=True)
                .distinct()
                .order_by("component_type")
            )

            return {
                "event_types": event_types or ["System", "Application", "Network"],
                "component_types": component_types or ["CPU", "Memory", "Disk", "Network", "System"],
                "time_ranges": ["last_hour", "last_24_hours", "last_week", "last_month", "yesterday"],
                "device_id": device_id,
            }

        except Exception as e:
            logger.exception(f"[EventLogFilterService] Error getting filter options: {e}")
            return {
                "event_types": ["System", "Application", "Network"],
                "component_types": ["CPU", "Memory", "Disk", "Network", "System"],
                "time_ranges": ["last_hour", "last_24_hours", "last_week", "last_month"],
                "device_id": device_id,
            }

    # ======================== TIME RANGE FILTERS ========================
    def _get_time_filter(self, time_range: str) -> Optional[Q]:
        now = timezone.now()
        if time_range == "last_hour":
            return Q(created_at__gte=now - timedelta(hours=1))
        elif time_range == "last_24_hours":
            return Q(created_at__gte=now - timedelta(hours=24))
        elif time_range == "yesterday":
            start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=1)
            return Q(created_at__range=(start, end))
        elif time_range == "last_week":
            return Q(created_at__gte=now - timedelta(weeks=1))
        elif time_range == "last_month":
            return Q(created_at__gte=now - timedelta(days=30))
        return None

    # ======================== SERVICE STATS ========================
    def get_service_stats(self) -> Dict[str, Any]:
        return {
            "query_stats": self._query_stats.copy(),
            "DEFAULT_LIMIT": DEFAULT_LIMIT,
            "MAX_LIMIT": MAX_LIMIT,
            "SLOW_QUERY_THRESHOLD": SLOW_QUERY_THRESHOLD,
        }

    def reset_stats(self):
        self._query_stats = {
            'total_queries': 0,
            'slow_queries': 0,
            'errors': 0,
        }
