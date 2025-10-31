from django.conf import settings
from BaseApp.models import WebUser
from rest_framework.response import Response
from rest_framework import status
import jwt


def verify_reset_password_token(request):
    """
    Verify the reset password token before allowing password reset.
    Returns validation status without modifying user state.
    """
    try:
        # Decode the token
        token = request.query_params.get('token')
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        
        # Check token purpose (optional but recommended for security)
        if payload.get('purpose') != 'password_reset':
            return Response(
                {"valid": False, "error": "Invalid token purpose"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify user exists
        user_id = payload.get('user_id')
        user = WebUser.objects.get(id=user_id)
        
        # Token is valid
        return Response(
            {"valid": True, "message": "Token verified successfully"}, 
            status=status.HTTP_200_OK
        )
        
    except jwt.ExpiredSignatureError:
        return Response(
            {"valid": False, "error": "Reset password link expired"}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    except jwt.InvalidTokenError:
        return Response(
            {"valid": False, "error": "Invalid token"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except WebUser.DoesNotExist:
        return Response(
            {"valid": False, "error": "User not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
