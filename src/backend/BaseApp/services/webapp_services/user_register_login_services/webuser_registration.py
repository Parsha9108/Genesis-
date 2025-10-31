
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
from BaseApp.serializer import WebLoginSerializer, WebUserSerializer
from django.contrib.auth.hashers import check_password
import jwt, json
import datetime
from urllib.parse import quote
from .welcome_email_service import EmailService  # Assume this is a custom email service module
import logging

logger = logging.getLogger("agent_monitoring")

def generate_email_token(user):
    """Generate secure email verification token"""
    payload = {
        "user_id": str(user.id),
        "email": user.email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=15),
        "iat": datetime.datetime.utcnow(),
        "purpose": "email_verification"
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

def register_web_user(request):
    """Enhanced user registration with professional email system"""
    try:
        logger.info(f"📝 User registration attempt: {request.data}")
        
        role = request.data.get('role').lower()
        raw_password = request.data.get("password")

        # Validate admin registration
        if role == 'admin' and WebUser.objects.filter(role='admin').exists():
            logger.warning("❌ Admin registration blocked - admin already exists")
            return Response({
                'success': False,
                'error': 'Admin user already exists. Only one admin is allowed.',
                'code': 'ADMIN_EXISTS'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate required fields
        if not raw_password:
            return Response({
                'success': False,
                'error': 'Password is required',
                'code': 'MISSING_PASSWORD'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create user
        serializer = WebUserSerializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"❌ User validation failed: {serializer.errors}")
            return Response({
                'success': False,
                'errors': serializer.errors,
                'code': 'VALIDATION_ERROR'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Save user as inactive
        user = serializer.save()
        user.is_active = False
        
        if user.role == "admin":
            user.is_first_login = False
        else:
            user.is_first_login = True
            
        user.save()
        
        logger.info(f"👤 User created: {user.username} ({user.role})")

        # Generate verification token and URL
        token = quote(generate_email_token(user))
        verify_url = f"https://192.168.100.101/app/verify-email/{token}/"

        # Send appropriate email based on role
        email_success = False
        email_message = ""
        
        if role == 'admin':
            email_success, email_message = EmailService.send_admin_verification_email(user, verify_url)
        else:
            email_success, email_message = EmailService.send_user_welcome_email(user, verify_url, raw_password)

        # Prepare response
        response_data = {
            'success': True,
            'message': 'User registered successfully',
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat() if hasattr(user, 'created_at') else None
            },
            'verification': {
                'email_sent': email_success,
                'email_message': email_message,
                'expires_in_minutes': 15
            }
        }

        if email_success:
            logger.info(f"✅ Registration completed successfully for {user.username}")
            return Response(response_data, status=status.HTTP_201_CREATED)
        else:
            logger.warning(f"⚠️ User created but email failed for {user.username}: {email_message}")
            response_data['warning'] = 'User created but email delivery failed'
            return Response(response_data, status=status.HTTP_201_CREATED)

    except IntegrityError as e:
        logger.error(f"❌ Database integrity error: {str(e)}")
        return Response({
            'success': False,
            'error': 'User with this email or username already exists',
            'code': 'DUPLICATE_USER'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"❌ Unexpected error during registration: {str(e)}")
        return Response({
            'success': False,
            'error': 'An unexpected error occurred during registration',
            'code': 'INTERNAL_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

