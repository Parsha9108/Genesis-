from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
import jwt
from django.conf import settings
from BaseApp.models import WebUser

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
