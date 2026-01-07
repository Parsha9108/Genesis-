from BaseApp.services.imports import Response, status, socket, platform, AgentSerializer, logging
from BaseApp.services.webapp_services.license_management_service.license_validation import validate_agent_request

logger = logging.getLogger("agent_monitoring")
API_KEY = "1234567890abcdef1234567890abcdef"

def create_agent(request):
    """
    Create a new agent with auto-detected system details.

    This function checks for a valid API key, collects basic system info,
    validates and saves the agent, then returns credentials for OAuth setup.
    """
    logger.info("Agent creation request received")

    # Validate API key
    api_key = request.headers.get("X-API-KEY")
    if api_key != API_KEY:
        logger.warning("Unauthorized attempt to create agent - Invalid API key")
        return Response({"error": "Invalid API key"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        license_ok, license_msg = validate_agent_request()
    except Exception:
        logger.exception("License validation crashed")
        return Response({"error": "License validation error"}, status=500)

    if not license_ok:
        return Response({"error": license_msg}, status=403)

    try:
        hostname = request.data.get("hostname")
        os_info = request.data.get("os")
        master_key = request.data.get("master_key")
        os_version = request.data.get("os_version")

        data = {
            "os": os_info,
            "hostname": hostname,
            "master_key": master_key,
            "os_version":os_version
        }

        logger.debug(f"Creating agent with data: {data}")

        serializer = AgentSerializer(data=data)
        if serializer.is_valid():
            agent = serializer.save()
            logger.info(f"Agent Onboard successfully: UUID={agent.uuid}, Hostname={hostname}")

            return Response({
                "uuid": str(agent.uuid),
                "client_id": agent.oauth_application.client_id,
                "client_secret": agent.oauth_application.client_secret,
                "master_key": agent.master_key,
            }, status=status.HTTP_201_CREATED)

        logger.error(f"Agent creation failed - validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.exception(f"Unexpected error during agent creation: {str(e)}")
        return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
