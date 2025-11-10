from django.core.mail import EmailMultiAlternatives
from rest_framework import status
from rest_framework.response import Response
from django.conf import settings
from BaseApp.models import WebUser
import jwt,datetime
from urllib.parse import quote
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

def sendemail_to_reset_password(request):
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

    user = WebUser.objects.get(email=email)
    token = generate_password_reset_token(user)
    token_encoded = quote(token)
    reset_link = f"https://192.168.100.91/app/reset-password/{user.id}?token={token_encoded}"



    # Send HTML email
    subject = 'Reset Your Password'
    from_email = settings.DEFAULT_FROM_EMAIL
    to_email = [email]

    html_content = f"""
        <h2>Password Reset Requested</h2>
        <p>Click the button below to reset your password:</p>
        <a href="{reset_link}"
            style="padding: 10px 20px; background-color: #007bff;
                    color: white; text-decoration: none; border-radius: 5px;">
            Reset Password
        </a>
        <p>If you did not request this, please ignore this email.</p>
    """

    try:
        msg = EmailMultiAlternatives(subject, '', from_email, to_email)
        msg.attach_alternative(html_content, "text/html")
        msg.send()
    except Exception as e:
        return Response(
            {'error': 'Failed to send email. Reason Try again later.'},status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(
        {'message': 'Reset email sent successfully.'},status=status.HTTP_200_OK)
    