from django.http import JsonResponse
from django.conf import settings
import jwt
from BaseApp.models import WebUser

def web_dashboard(request):
    token = request.COOKIES.get('jwt')
   
    if not token:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expired"}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({"error": "Invalid token"}, status=401)

    try:
        user = WebUser.objects.get(id=payload["id"])
    except WebUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    user_data = {
        'id': user.id,  # Explicitly add user ID
        **{
            field.name: getattr(user, field.name)
            for field in user._meta.fields
            if field.name not in ['password', 'id']  # Exclude password, avoid id duplication
        }
    }  
    return JsonResponse({"user": user_data}, status=200)
