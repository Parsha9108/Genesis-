from rest_framework.response import Response
from BaseApp.models import WebUser
from rest_framework import status

def check_email(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    if WebUser.objects.filter(email__iexact=email).exists():
            return Response({'available': False, 'message': 'This email is already registered.'})
    return Response({'available': True})

   
       