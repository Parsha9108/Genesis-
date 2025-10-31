from rest_framework.response import Response
from django.contrib.auth.signals import user_logged_out
import jwt
from django.conf import settings
from BaseApp.models import WebUser
import datetime
def logout_view(request):
    jwt_token = request.COOKIES.get('jwt')
    
    if jwt_token:
        try:
            payload = jwt.decode(jwt_token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('id')

            user = WebUser.objects.get(id=user_id)
            user.is_currently_logged_in = False
            user.last_logout_time = datetime.datetime.utcnow()
            user.save(update_fields=['is_currently_logged_in', 'last_logout_time'])
            
            user_logged_out.send(sender=user.__class__, request=request, user=user)
            
        except:
            pass 
    
    response = Response({"message": "Logged out successfully"}, status=200)
    response.delete_cookie('jwt')
    return response
