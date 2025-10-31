# services/event_service.py
from BaseApp.services.imports import sync_to_async, logging, Event
# services/event_service.py
from ...models import MonitoringSession
from asgiref.sync import sync_to_async
from django.utils.timezone import now

logger = logging.getLogger("agent_monitoring")

class EventService:

    @staticmethod
    @sync_to_async
    def create_event(agent, event_type, description=None, component_type=None):
        # For MON_DATA, reuse or create a new session
        if event_type == 'MON_DATA' or event_type == 'HTTPS_CONNECTION':
            session = MonitoringSession.objects.filter(agent=agent, ended_at__isnull=True).first()
            if session:
                return session.event  # reuse
       
        # Otherwise or if no session found, create a new event
        event = Event.objects.create(
            agent=agent,
            event_type=event_type,
            description=description,
            component_type=component_type,
        )

        # If MON_DATA, create session
        if event_type == 'MON_DATA' or event_type == 'HTTPS_CONNECTION':
            MonitoringSession.objects.update_or_create(
                agent=agent,
                defaults={'event': event, 'ended_at': None}
            )
        return event
