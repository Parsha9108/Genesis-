from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
import jwt
from BaseApp.models.models import WebUser,Agent
import json, base64
from django.core.cache import cache
from django.conf import settings
from BaseApp.models.global_config import GlobalConfig
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
from django.utils.timezone import now, make_aware, is_naive
from django.utils.dateparse import parse_datetime
import os
# import socket
# import subprocess
# import netifaces
import hashlib
from django.db import connection
from BaseApp.models import LicenseState
from datetime import timedelta

class JWTCookieAuthentication(BaseAuthentication):
    def authenticate(self, request):
        token = request.COOKIES.get('jwt')
        if not token:
            return None
        
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user = WebUser.objects.get(id=payload['id'])
            return (user, token)
        except (jwt.InvalidTokenError, WebUser.DoesNotExist):
            raise AuthenticationFailed('Invalid token')


def check_permission(module, allowed_action):
    def decorator(func):
        # @wraps(func)
        def wrapper(request, *args, **kwargs):
            if request.user:
                if request.user.role.check_permission(module=module, action=allowed_action):
                    return func(request, *args, **kwargs)
                else:
                    return Response({
                    'success': False,
                    'error': 'User does not have permission to access this resource.',
                    'code': 'NO_ACCESS'
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'success': False,
                    'error': 'User Not Logged In.',
                    'code': 'NO_LOGIN_FOUND'
                }, status=status.HTTP_400_BAD_REQUEST)
            
        return wrapper
    return decorator


# CONFIG_FILE = "/etc/genesis/genesis.conf"


# def write_uuid_to_config(system_uuid):
#     try:
#         with open(CONFIG_FILE, "r") as f:
#             content = f.read()
#             if "SYSTEM_UUID=" in content:
#                 return 
#     except:
#         pass
#     with open(CONFIG_FILE, "a") as f:
#         f.write(f"SYSTEM_UUID={system_uuid}\n")


# def read_system_uuid_from_config():
#     if not os.path.exists(CONFIG_FILE):
#         return None

#     try:
#         with open(CONFIG_FILE, "r") as f:
#             for line in f:
#                 if line.startswith("SYSTEM_UUID="):
#                     return line.split("=")[1].strip()
#     except:
#         return None

#     return None


# def get_system_uuid():
#     try:
#         return subprocess.check_output(
#             ["sudo", "dmidecode", "-s", "system-uuid"]
#         ).decode().strip()
#     except:
#         return None


# def get_hostname():
#     return socket.gethostname()


# def get_mac():
#     for iface in netifaces.interfaces():
#         addrs = netifaces.ifaddresses(iface)
#         if netifaces.AF_LINK in addrs:
#             for a in addrs[netifaces.AF_LINK]:
#                 mac = a.get("addr")
#                 if mac and mac != "00:00:00:00:00:00":
#                     return mac
#     return None



CACHE_KEY = "LICENSE_DATA"  
def load_public_key():
    with open(settings.LICENSE_PUBLIC_KEY_PATH, "rb") as f:
        return serialization.load_pem_public_key(f.read())


def load_licence_to_memory():
    encrypted_lic = GlobalConfig.get_config("license.key")
    if not encrypted_lic:
        return False, "No license installed"
    cache.delete(CACHE_KEY)

    try:
        decoded = base64.b64decode(encrypted_lic).decode()
        lic_data = json.loads(decoded)
    except:
        return False, "Invalid encrypted license format"

    payload = lic_data.get("payload")
    signature = base64.b64decode(lic_data.get("signature"))

    public = load_public_key()
    try:
        public.verify(
            signature,
            json.dumps(payload, sort_keys=True).encode(),
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()),
                        salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256()
        )
    except Exception:
        return False, "License signature invalid"

    cache.set(CACHE_KEY, payload, timeout=None)

    return True, "License loaded & verified successfully"


def get_license_payload():
    payload = cache.get(CACHE_KEY)

    if payload:
        return True, payload

    ok, msg = load_licence_to_memory()
    if not ok:
        return False, msg

    payload = cache.get(CACHE_KEY)
    return True, payload

def get_license_status():
    ok, payload = get_license_payload()
    if not ok:
        return {"error": payload}

    expiry = parse_datetime(payload.get("expiry"))
    if expiry and is_naive(expiry):
        expiry = make_aware(expiry)

    expired = expiry < now() if expiry else True
    max_devices = payload.get("max_devices", 0)
    onboarded = Agent.objects.count()

    return {
        "status": "expired" if expired else "valid",
        "deployment_id": payload.get("deployment_id"),
        "expiry_date": expiry.date().isoformat() if expiry else None,
        "max_devices": max_devices,
        "devices_onboarded": onboarded,
        "devices_remaining": max(max_devices - onboarded, 0),
    }





def get_db_fingerprint():
    with connection.cursor() as cursor:
        cursor.execute("SELECT system_identifier FROM pg_control_system()")
        db_id = cursor.fetchone()[0]

    return hashlib.sha256(str(db_id).encode()).hexdigest()


def activate_license_if_needed():
    if LicenseState.objects.exists():
        return

    LicenseState.objects.create(
        id=1,
        db_fingerprint=get_db_fingerprint(),
        activated_at=now()
    )


def validate_db_binding():
    state = LicenseState.objects.get(id=1)
    current_fp = get_db_fingerprint()

    if state.db_fingerprint == current_fp:
        return True, "OK"

    if now() - state.activated_at < timedelta(days=7):
        return True, "DB changed (grace period)"

    return False, "License not valid for this database"



def validate_deployment(payload):
    deployment_env = os.getenv("GENESIS_DEPLOYMENT_ID")
    if not deployment_env:
        return False, "Deployment ID missing"

    if payload.get("deployment_id") != deployment_env:
        return False, "License not valid for this deployment"

    return True, "OK"
