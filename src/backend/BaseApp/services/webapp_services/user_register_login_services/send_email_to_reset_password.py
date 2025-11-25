from django.core.mail import EmailMultiAlternatives
from rest_framework import status
from rest_framework.response import Response
from django.conf import settings
from BaseApp.models import WebUser
import jwt,datetime
from urllib.parse import quote
import logging
from BaseApp.services.webapp_services.email_notifications.Emailtemplates import EmailTemplates
from ..email_notifications.Sendemail_service import EmailService
logger = logging.getLogger("agent_monitoring")
# token generation for password reset
def generate_password_reset_token(user):
    payload = {
        "user_id": str(user.id),
        "email": user.email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=15),  # expiry in 15 mins
        "iat": datetime.datetime.utcnow(),
        "purpose": "password_reset"
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return token
# function to send reset password email with token

def sendemail_to_reset_password(request):
    try:
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if email exists
        if not WebUser.objects.filter(email=email).exists():
            return Response({'error': 'No user found with this email.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            user = WebUser.objects.get(email=email)
        except WebUser.DoesNotExist:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            user = WebUser.objects.get(email=email)
            token = generate_password_reset_token(user)
            token_encoded = quote(token)
            reset_link = f"https://192.168.100.92/app/reset-password/{user.id}?token={token_encoded}"
        except Exception as e:
            return Response({'error': 'Failed to generate reset token. Please try again later.'},status=status.HTTP_500_INTERNAL_SERVER_ERROR) 
      
        try:
            html_content, plain_text, subject=EmailTemplates.get_password_reset_email_template(email=user.email, reset_link=reset_link)
            
            success=EmailService.send_email([user.email],html_content,plain_text,subject)
            
        except Exception as e:
            return Response(
                {'error': 'Failed to send email. Please Try again later.'},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        if success:
            return Response({'message': 'Reset email sent successfully.'},status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Failed to send reset email. Please try again later.'},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({'error': 'An error occurred. Please try again later.'},status=status.HTTP_500_INTERNAL_SERVER_ERROR)


   