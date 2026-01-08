import json, base64
from django.core.cache import cache
from datetime import datetime,timezone
from BaseApp.models import Agent  
from BaseApp.utils import read_system_uuid_from_config, get_mac, get_hostname,get_license_payload


def normalize_system_uuid(value):
    if value is None:
        return None
    if value in ("None", "", "null", "NULL"):
        return None
    return value


def validate_agent_request():

    ok, result = get_license_payload()
    if not ok:
        return False, result

    payload = result
    if not payload:
        return False, "License missing or not loaded"

    system_uuid = normalize_system_uuid(read_system_uuid_from_config())
    hostname = get_hostname()
    mac = get_mac()


    if system_uuid:
        license_uuid = payload.get("system_uuid")

        if not license_uuid:
            return False, "License is not valid for this machine"

        if license_uuid != system_uuid:
            return False, "License is not valid for this machine"

    else:
        license_hostname = payload.get("hostname")
        license_mac = payload.get("mac")

        matched = False

        if license_hostname and license_hostname == hostname:
            matched = True

        if license_mac and license_mac == mac:
            matched = True

        if (license_hostname or license_mac) and not matched:
            return False, "License is not valid for this machine"
        
    expiry = datetime.fromisoformat(payload["expiry"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expiry:
        return False, "License expired"

    if Agent.objects.count() >= payload["max_devices"]:
        return False, "Device limit reached"

    return True, "VALID"

