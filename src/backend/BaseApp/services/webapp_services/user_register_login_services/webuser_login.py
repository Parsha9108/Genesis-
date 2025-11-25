
import email
import requests
from rest_framework.response import Response
from rest_framework import status
from BaseApp.models import WebUser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError
from rest_framework.permissions import AllowAny
from django.conf import settings
from django.core.mail import send_mail
from BaseApp.serializer import WebLoginSerializer, WebUserSerializer
from django.contrib.auth.hashers import check_password
import jwt,json
import datetime
from urllib.parse import quote
from django.contrib.auth.signals import user_logged_in

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

def login_web_user(request):
    data = json.loads(request.body)
    email = data.get("email")
    password = data.get("password")
    try:
        user = WebUser.objects.get(email=email)
    except WebUser.DoesNotExist:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    if not check_password(password, user.password):
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    elif not user.is_email_verified:
        return Response({"error": "Email not verified. Please check your inbox."}, status=status.HTTP_404_NOT_FOUND)
     # Check 1: Account Active
    elif not user.is_active:
        return Response({
            "success": False,
            "error": "Account Inactive",
            "message": "Your account has been deactivated. Please contact your administrator to activate",
        }, status=status.HTTP_403_FORBIDDEN)
    
    user.is_currently_logged_in = True
    user.last_login = datetime.datetime.utcnow()
    user.save(update_fields=['is_currently_logged_in', 'last_login'])

    user_logged_in.send(sender=user.__class__, request=request, user=user)

    token = generate_jwt(user)
    response_data = {}
    if user.is_first_login:
        # Indicate first time login to frontend for custom redirect
        response_data = {
            "message": "First time login. Password reset required.",
            "email": email,
            "first_time_login": True,
        }
    else:
        response_data = {
            "message": "Login successful.",
            "first_time_login": False,
        }

    response = Response(response_data, status=status.HTTP_200_OK)
    set_jwt_cookie(response, token)
    return response
