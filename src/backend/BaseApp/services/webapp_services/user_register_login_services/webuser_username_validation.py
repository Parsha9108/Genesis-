from rest_framework.response import Response
from rest_framework import status
from BaseApp.models import WebUser

def check_username(request):
    """
    Validates the username to ensure it meets specific criteria.
    """
    username = request.data.get('username')
    if not username:
        return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
    if WebUser.objects.filter(username__iexact=username).exists():
        return Response({'available': False, 'message': 'This username is already exists.'})
    return Response({'available': True})