from rest_framework.response import Response
from rest_framework import status
from ....models import WebUser
from ....serializer import WebUserSerializer


def delete_web_user(request, user_id):
    try:
        user = WebUser.objects.get(id=user_id)
        user.delete()
        return Response({"message": "User deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
    except WebUser.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)