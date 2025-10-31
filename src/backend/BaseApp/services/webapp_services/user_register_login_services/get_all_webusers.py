from rest_framework.response import Response
from rest_framework import status
from ....models import WebUser
from ....serializer import WebUserSerializer


def get_all_users(request):
    users = WebUser.objects.all()
    serializer = WebUserSerializer(users, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

