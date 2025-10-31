import logging
from BaseApp.services.imports import json, Response, status, Agent, DeviceSerializer

# Configure logger
logger = logging.getLogger("agent_monitoring")

def store_scanned_data(request):
    """
    Validate token and store device details with original OS UUIDs.
    
    Args:
        request: The HTTPS request object containing device data
        
    Returns:
        Response: HTTP response with status code and data/error message
    """
    logger.info("Processing new device scan request")
    
    if request.method != 'POST':
        logger.warning(f"Method not allowed: {request.method}")
        return Response(
            {"error": f"Method {request.method} not allowed. Only POST is supported."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    # Parse and validate request data
    data = _parse_request_data(request)
    if isinstance(data, Response):
        return data
    
    # Validate authentication
    auth_result = _authenticate_request(request)
    if isinstance(auth_result, Response):
        return auth_result
    
    agent = auth_result
    
    # Process device data
    return _process_device_data(data, agent)


def _parse_request_data(request):
    """
    Parse and validate the request data format.
    
    Args:
        request: The HTTP request object
        
    Returns:
        dict or Response: Parsed data or error response
    """
    logger.debug("Parsing request data")
    
    if isinstance(request.data, str):
        try:
            data = json.loads(request.data)
            logger.debug("Successfully parsed JSON string data")
        except json.JSONDecodeError:
            logger.error("Invalid JSON format in request body")
            return Response(
                {"error": "Invalid JSON format in request body."},
                status=status.HTTP_400_BAD_REQUEST
            )
    elif isinstance(request.data, dict):
        data = request.data
        logger.debug("Request data already in dictionary format")
    else:
        logger.error(f"Unsupported request data format: {type(request.data)}")
        return Response(
            {"error": "Unsupported request data format."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return data


def _authenticate_request(request):
    """
    Authenticate the request by validating token and agent.
    
    Args:
        request: The HTTP request object
        
    Returns:
        Agent or Response: Agent object if authenticated, otherwise error response
    """
    logger.debug("Authenticating request")
    
    # Validate access token
    access_token = _validate_authorization(request)
    if not access_token:
        logger.warning("Missing or invalid Authorization header")
        return Response(
            {"error": "Missing or invalid Authorization header"}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Validate agent UUID
    agent_uuid = request.headers.get("uuid")
    if not agent_uuid:
        logger.warning("UUID header is missing")
        return Response(
            {"error": "UUID header is missing."}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    # Retrieve agent
    try:
        agent = Agent.objects.get(uuid=agent_uuid)
        logger.debug(f"Found agent with UUID: {agent_uuid}")
    except Agent.DoesNotExist:
        logger.error(f"Agent not found with UUID: {agent_uuid}")
        return Response(
            {"error": "Agent not found."}, 
            status=status.HTTP_404_NOT_FOUND
        )

    # Validate token for the agent
    if not agent.validate_access_token(access_token):
        logger.warning(f"Invalid or expired token for agent: {agent_uuid}")
        return Response(
            {"error": "Invalid or expired token"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    return agent


def _process_device_data(data, agent):
    """
    Process and store device data.
    
    Args:
        data: The parsed request data
        agent: The authenticated Agent object
        
    Returns:
        Response: HTTP response with status code and data/error message
    """
    logger.debug("Processing device data")
    
    # Validate device data
    raw_device_data = data.get("device")
    if not isinstance(raw_device_data, dict):
        logger.error("'device' field must be a JSON object")
        return Response(
            {"error": "'device' field must be a JSON object."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Extract OS UUIDs and prepare data
    device_data, os_uuids = _extract_os_uuids(raw_device_data)
    
    # Validate and save device
    device_serializer = DeviceSerializer(data=device_data)
    if not device_serializer.is_valid():
        logger.error(f"Device validation failed: {device_serializer.errors}")
        return Response(
            device_serializer.errors, 
            status=status.HTTP_400_BAD_REQUEST
        )

    # Save device and associate with agent
    device = device_serializer.save(agent=agent)
    logger.info(f"Device saved successfully with ID: {device}")
    
    # Prepare response with original OS UUIDs
    enhanced_device = _inject_os_uuids(device_serializer.data, os_uuids)
    
    return Response({
        "agent": {
            "uuid": agent.uuid,
            "os": agent.os,
            "hostname": agent.hostname,
            "os_version":agent.os_version
        },
        "device": enhanced_device
    }, status=status.HTTP_201_CREATED)


def _extract_os_uuids(data, prefix=""):
    """
    Extract and preserve original OS UUIDs from device data.
    
    Args:
        data: Device data dictionary
        prefix: Optional prefix for keys
        
    Returns:
        tuple: (device_data, os_uuids)
    """
    logger.debug("Extracting OS UUIDs from device data")
    os_uuids = {}
    device_data = data.copy()
    
    if 'os_uuid' in device_data:
        os_uuids[f'{prefix}device'] = device_data.pop('os_uuid')
    
    for component in ['cpu', 'memory', 'storage', 'nic', 'gpu']:
        if component in device_data:
            os_uuids[component] = []
            for item in device_data[component]:
                os_uuids[component].append(item.pop('os_uuid', None))
                
                if component == 'storage' and 'partition' in item:
                    os_uuids['partition_os_uuids'] = os_uuids.get('partition_os_uuids', [])
                    part_uuids = [part.pop('os_uuid', None) for part in item['partition']]
                    os_uuids['partition_os_uuids'].append(part_uuids)
    
    return device_data, os_uuids


def _inject_os_uuids(serialized_data, os_uuids):
    """
    Inject original OS UUIDs back into serialized data.
    
    Args:
        serialized_data: Serialized device data
        os_uuids: Dictionary of OS UUIDs
        
    Returns:
        dict: Enhanced device data with OS UUIDs
    """
    logger.debug("Injecting OS UUIDs back into serialized data")
    enhanced_data = serialized_data.copy()
    
    if 'device' in os_uuids:
        enhanced_data['os_uuid'] = os_uuids['device']
    
    for component in ['cpu', 'memory', 'storage', 'nic', 'gpu']:
        if component in enhanced_data and component in os_uuids:
            enhanced_data[component] = [
                {**item, 'os_uuid': os_uuids[component][i]}
                for i, item in enumerate(enhanced_data[component])
            ]
            
            if component == 'storage' and 'partition_os_uuids' in os_uuids:
                for j, storage in enumerate(enhanced_data[component]):
                    if 'partition' in storage and j < len(os_uuids['partition_os_uuids']):
                        storage['partition'] = [
                            {**part, 'os_uuid': os_uuids['partition_os_uuids'][j][k]}
                            for k, part in enumerate(storage['partition'])
                        ]
    
    return enhanced_data


def _validate_authorization(request):
    """
    Validate Authorization header and return token.
    
    Args:
        request: The HTTP request object
        
    Returns:
        str or None: The access token if valid, None otherwise
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        logger.warning("Invalid or missing Authorization header format")
        return None
    
    token = auth_header.split("Bearer ")[-1]
    logger.debug("Authorization token extracted")
    return token