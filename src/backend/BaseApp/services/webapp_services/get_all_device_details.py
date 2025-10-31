from rest_framework.response import Response
from BaseApp.models import Device,Agent,IPAddress
from BaseApp.serializer import WebAgentSerializer
from rest_framework import status


def get_all_device_details(request):
    return Response({
        "device":WebAgentSerializer(Agent.objects.all(), many=True).data,
    }, status=status.HTTP_200_OK)

   
def get_device_by_uuid(request, uuid):
    try:
        device = Agent.objects.get(uuid=uuid)
        serializer = WebAgentSerializer(device)
        return Response({"device": serializer.data}, status=status.HTTP_200_OK)
    except Agent.DoesNotExist:
        return Response({"error": "Device not found"}, status=status.HTTP_404_NOT_FOUND)