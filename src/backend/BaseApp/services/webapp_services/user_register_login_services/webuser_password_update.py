from django.contrib.auth.hashers import make_password
from rest_framework.response import Response
from rest_framework import status
from BaseApp.models import WebUser
from django.conf import settings
from django.core.mail import send_mail
from datetime import datetime
import jwt

def update_password(request):
    token = request.query_params.get('token')
    password = request.data.get('password')
    email = request.data.get('email')
    
    if token:
        # Token based flow (forgot password)
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            if payload.get('purpose') != 'password_reset':
                return Response({'error': 'Invalid token purpose'}, status=status.HTTP_400_BAD_REQUEST)
            user_id = payload.get('user_id')
            user = WebUser.objects.get(id=user_id)
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token has expired'}, status=status.HTTP_400_BAD_REQUEST)
        except (jwt.InvalidTokenError, WebUser.DoesNotExist):
            return Response({'error': 'Invalid token or user'}, status=status.HTTP_400_BAD_REQUEST)

    elif email:
        # First-time password set flow (no token, use email)
        try:
            user = WebUser.objects.get(email=email)
            # (Optionally) check user.is_first_login is True here, if required
        except WebUser.DoesNotExist:
            return Response({'error': 'Invalid user'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response({'error': 'Token or email required'}, status=status.HTTP_400_BAD_REQUEST)

    if not password:
        return Response({'error': 'New password is required'}, status=status.HTTP_400_BAD_REQUEST)

    user.password = make_password(password)
    user.save()
    send_password_update_email(user, datetime.now())

    # (Optionally) if user.is_first_login: set to False after first password set
    if hasattr(user, 'is_first_login') and user.is_first_login:
        user.is_first_login = False
        user.save(update_fields=["is_first_login"])

    return Response({'message': 'Password updated successfully'}, status=status.HTTP_200_OK)

def send_password_update_email(user, password_changed_time):
    subject = "🔒 Your Password Has Been Changed"
    changed_time_str = password_changed_time.strftime("%Y-%m-%d %H:%M:%S")
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>{subject}</title>
      <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; background-color: #f3f4f6; }}
        h2 {{ color: #ef4444; }}
        .content {{ background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .footer {{ font-size: 12px; color: #6b7280; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="content">
        <h2>🔒 Password Changed!</h2>
        <p>Hello {user.username},</p>
        <p>Your password for the account with email <strong>{user.email}</strong> was changed on <strong>{changed_time_str}</strong>.</p>
        <p>If you did not perform this change, please contact your administrator or IT support immediately.</p>
        <hr>
        <p><strong>Account Role:</strong> {user.role.upper()}</p>
      </div>
      </div><div class="footer">
                <p style="margin: 0 0 10px 0;">© {datetime.now().year} Your Company Name. All rights reserved.</p>
                <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
                <p style="margin: 10px 0 0 0; font-size: 12px;">Need help? Contact support at support@yourcompany.com</p>
      </div>
    </body>
    </html>
    """
    plain_content = f"""
    {subject}

    Hello {user.username},

    Your password for the account with email {user.email} was changed on {changed_time_str}.

    If you did not perform this change, please contact your administrator or IT support immediately.

    Account Role: {user.role.upper()}

    This is an automated security notification. Please do not reply to this email.
    """
    send_mail(
        subject=subject,
        message=plain_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_content,
        fail_silently=False
    )
