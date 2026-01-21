from rest_framework.response import Response
from BaseApp.models.models import Device,Agent,IPAddress
from BaseApp.serializer import WebAgentSerializer,WebAgentserializer
from rest_framework import status
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
import django_filters

import logging
logger = logging.getLogger('agent_monitoring')
class Pageination(PageNumberPagination):
    page_size = 10  
    page_size_query_param = 'page_size'
    max_page_size = 100

def get_all_device_details(request):
    try:
        qs = Agent.objects.all()
        search_query=request.query_params.get('search','')
        if search_query:
           qs=qs.filter(
               Q(hostname__icontains=search_query) |
               Q(os__icontains=search_query) |
               Q(status__icontains=search_query) |
               Q(device__dev_phy_vm__icontains=search_query) |
               Q(device__nic__port__ip__address__icontains=search_query)
           ).distinct()
        
        pageinator=Pageination()
        page=pageinator.paginate_queryset(qs, request)
        serializer=WebAgentserializer(page, many=True)
        return pageinator.get_paginated_response(serializer.data)
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
def get_device_by_uuid(request, uuid):
    try:
        device = Agent.objects.get(uuid=uuid)
        serializer = WebAgentSerializer(device)
        return Response({"device": serializer.data}, status=status.HTTP_200_OK)
    except Agent.DoesNotExist:
        return Response({"error": "Device not found"}, status=status.HTTP_404_NOT_FOUND)
