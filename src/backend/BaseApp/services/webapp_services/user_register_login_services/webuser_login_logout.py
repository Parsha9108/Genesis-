
from rest_framework.response import Response
from rest_framework import status
from BaseApp.models import WebUser
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.contrib.auth.hashers import check_password
import jwt,json
import datetime
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated,AllowAny
from BaseApp.utils import JWTCookieAuthentication
from BaseApp.models.audit_logs import AuditLog
from ipware import get_client_ip

import logging
logger = logging.getLogger("agent_monitoring")
def generate_jwt(user):
    payload = {
        "id": str(user.id),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
        "iat": datetime.datetime.utcnow()
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
 
def set_jwt_cookie(response, token):
    response.set_cookie(
        key="jwt",
        value=token,
        httponly=True,
        samesite='None',
        secure=True,
        max_age=604800,
    )
    return response

@api_view(['POST'])
@permission_classes([AllowAny])
def web_user_login_view(request):
    data = json.loads(request.body)
    email = data.get("email")
    password = data.get("password")
    
    if request:
        ip_address,is_routable =get_client_ip(request)
        
    try:
        user = WebUser.objects.get(email=email)
    except WebUser.DoesNotExist:
         # Log failed login - user not found
        AuditLog.objects.create(
            model_name="WebUser",
            action="LOGIN_FAILED",
            user=email,  # Use email since user doesn't exist
            description=f"Failed login attempt for non-existent user '{email}'",
            ip=ip_address
        )
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    
     # Check 2: Password Match
    if not check_password(password, user.password):
        AuditLog.objects.create(
            model_name="WebUser",
            action="LOGIN_FAILED",
            user=user.username,
            description=f"User '{user.username}' ({user.email}) "
            f"failed login attempt with incorrect password ",
            ip=ip_address
        )
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
   
    elif not user.is_email_override and not user.is_email_verified:
          # Log failed login - account disabled
        AuditLog.objects.create(
            model_name="WebUser",
            action="LOGIN_FAILED",
            user=user.username,
            description=f"Failed login attempt for acount disabled user '{user.username}'",
            ip=ip_address
        )
        return Response({"error": "Email not verified. Please check your inbox."}, status=status.HTTP_404_NOT_FOUND)
     # Check 1: Account Active
    elif not user.is_user_enabled:
        return Response({
            "success": False,
            "error": "Account Inactive",
            "message": "Your account has been deactivated. Please contact your administrator to activate",
        }, status=status.HTTP_403_FORBIDDEN)
 
    user.last_login = datetime.datetime.now()
    # user.save()

    token = generate_jwt(user)
    response_data = {}

    response_data = {
            "message": "Login successful.",
        }
    response = Response(response_data, status=status.HTTP_200_OK)
    set_jwt_cookie(response, token)
    
    timestamp = datetime.datetime.now().strftime('%d %b %Y, %H:%M:%S')
    AuditLog.objects.create(
            action="LOGIN",
            user=user.username,
            description=f"User {user.username} authenticated successfully and logged in at {timestamp}",
            ip=ip_address
    )
    return response

@api_view(['POST'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def web_user_logout_view(request):
    
    if request:
        ip_address,is_routable =get_client_ip(request)
        
    jwt_token = request.COOKIES.get('jwt')
    
    if jwt_token:
        try:
            payload = jwt.decode(jwt_token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('id')

            user = WebUser.objects.get(id=user_id)
        except:
            pass 
    
    response = Response({"message": "Logged out successfully"}, status=200)
    response.delete_cookie('jwt')
   
    AuditLog.objects.create(
            action="LOGOUT",
            user=user.username,
            description=f"User {user.username} ended session and logged out at {datetime.datetime.now().strftime('%d %b %Y, %H:%M:%S')}",
            ip=ip_address
    )
    return response

