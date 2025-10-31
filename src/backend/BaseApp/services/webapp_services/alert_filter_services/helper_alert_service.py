import logging
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from django.utils import timezone
from django.db.models import Q
from dateutil import parser as date_parser  # ✅ ADD THIS IMPORT
from ....models import Alert

logger = logging.getLogger("alert_filtering")

class AlertFilterService:
    """Service for retrieving latest and filtered alerts with flexible filtering."""

    # ✅ UPDATED: Filtered alerts with custom date range support
    def filter_alerts(
        self,
        device_id: Optional[str] = None,
        severity: Optional[str] = None,
        alert_type: Optional[str] = None,
        time_range: Optional[str] = None,
        start_date: Optional[str] = None,  # ✅ ADDED
        end_date: Optional[str] = None,    # ✅ ADDED
        search_term: Optional[str] = None,
        limit: int = 200,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """Filter alerts with pagination and flexible search."""
        try:
            # 🔍 DEBUG: Log received parameters
            logger.info(f"[AlertFilterService] Received params - start_date: {start_date}, end_date: {end_date}")

            queryset = Alert.objects.select_related("agent").order_by("-created_at")

            # Apply filters
            if device_id:
                queryset = queryset.filter(agent__device__uuid=device_id)
                if not queryset.exists():
                    return {
                        "results": [],
                        "count": 0,
                        "limit": limit,
                        "offset": offset,
                        "message": f"No alerts found for device {device_id}",
                    }

            if severity:
                queryset = queryset.filter(severity=severity)
            
            if alert_type:
                queryset = queryset.filter(alert_type=alert_type)

            # ✅ Handle custom start_date and end_date from frontend
            if start_date and end_date:
                try:
                    # Use dateutil to handle ISO strings with 'Z' timezone indicator
                    start = date_parser.isoparse(start_date)
                    end = date_parser.isoparse(end_date)
                    queryset = queryset.filter(created_at__range=(start, end))
                    logger.info(f"[AlertFilterService] ✅ Custom range filter applied: {start} to {end}")
                    logger.info(f"[AlertFilterService] Queryset count after filter: {queryset.count()}")
                except Exception as e:
                    logger.warning(f"[AlertFilterService] ❌ Invalid custom range: {start_date}, {end_date} - Error: {e}")

            # Apply predefined (relative) time ranges
            elif time_range:
                time_filter = self._get_time_filter(time_range)
                if time_filter:
                    queryset = queryset.filter(time_filter)

            if search_term:
                queryset = queryset.filter(
                    Q(message__icontains=search_term)
                    | Q(device_name__icontains=search_term)
                    | Q(alert_type__icontains=search_term)
                )

            total_count = queryset.count()
            paginated_queryset = queryset[offset : offset + limit]

            results = []
            for alert in paginated_queryset:
                details = {}
                try:
                    details = json.loads(alert.details) if alert.details else {}
                except (json.JSONDecodeError, TypeError):
                    pass

                results.append({
                    "uuid": str(alert.uuid),
                    "agent_id": str(alert.agent.uuid) if alert.agent else None,
                    "device_name": alert.device_name,
                    "alert_type": alert.alert_type,
                    "severity": alert.severity,
                    "message": alert.message,
                    "source_uuid": alert.source_uuid,
                    "created_at": alert.created_at.isoformat(),
                    "is_read": alert.is_read,
                    "utilization": details.get("utilization"),
                    "component": details.get("component"),
                })

            return {
                "results": results,
                "count": total_count,
                "limit": limit,
                "offset": offset,
                "has_next": (offset + limit) < total_count,
                "has_previous": offset > 0,
                "device_id": device_id,
                "filters_applied": {  # ✅ ADDED for debugging
                    "device_id": device_id,
                    "severity": severity,
                    "alert_type": alert_type,
                    "time_range": time_range,
                    "start_date": start_date,
                    "end_date": end_date,
                    "search_term": search_term,
                },
            }

        except Exception as e:
            logger.error(f"Failed to filter alerts: {e}", exc_info=True)
            return {"results": [], "count": 0, "error": str(e)}

    # Helper for time filtering aligned to event log service
    def _get_time_filter(self, time_range: str) -> Optional[Q]:
        """Generate Q object for time-based filtering."""
        now = timezone.now()
        time_filters = {
            "last_hour": now - timedelta(hours=1),
            "last_24_hours": now - timedelta(hours=24),
            "last_week": now - timedelta(weeks=1),
            "last_month": now - timedelta(days=30),
        }

        if time_range == "previous_hour":
            current_hour = now.replace(minute=0, second=0, microsecond=0)
            previous_hour = current_hour - timedelta(hours=1)
            return Q(created_at__range=(previous_hour, current_hour))

        elif time_range == "yesterday":
            today = now.replace(hour=0, minute=0, second=0, microsecond=0)
            yesterday = today - timedelta(days=1)
            return Q(created_at__range=(yesterday, today))

        elif time_range == "last_week":
            today = now.date()
            days_since_monday = today.weekday()
            current_monday = today - timedelta(days=days_since_monday)
            last_monday = current_monday - timedelta(days=7)
            start = timezone.make_aware(datetime.combine(last_monday, datetime.min.time()))
            end = timezone.make_aware(datetime.combine(current_monday, datetime.min.time()))
            return Q(created_at__range=(start, end))

        elif time_range == "last_month":
            first_day_current = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            last_day_previous = first_day_current - timedelta(days=1)
            first_day_previous = last_day_previous.replace(day=1)
            return Q(created_at__range=(first_day_previous, first_day_current))

        elif time_range in time_filters:
            return Q(created_at__gte=time_filters[time_range])

        return None

    # Get dropdown filter options
    def get_filter_options(self, device_id: Optional[str] = None) -> Dict[str, List[str]]:
        """Return available dropdown options for filtering."""
        try:
            queryset = Alert.objects.all()
            if device_id:
                queryset = queryset.filter(agent__device__uuid=device_id)

                # Return empty lists if that device has no alerts
                if not queryset.exists():
                    return {
                        "severities": [],
                        "alert_types": [],
                        "time_ranges": [],
                        "message": f"No alerts found for device {device_id}",
                    }

            return {
                "severities": list(
                    queryset.values_list("severity", flat=True)
                    .distinct()
                    .order_by("severity")
                ),
                "alert_types": list(
                    queryset.values_list("alert_type", flat=True)
                    .distinct()
                    .order_by("alert_type")
                ),
                "time_ranges": [
                    "last_hour",
                    "last_24_hours",
                    "last_week",
                    "last_month",
                    "previous_hour",
                    "yesterday",
                ],
            }

        except Exception as e:
            logger.error(f"Failed to get filter options: {e}")
            return {
                "severities": [],
                "alert_types": [],
                "time_ranges": [],
                "error": str(e),
            }
