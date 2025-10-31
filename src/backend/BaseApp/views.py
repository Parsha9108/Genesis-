from BaseApp.services.agent_init_services.agent_onboard_service import create_agent
from BaseApp.services.agent_init_services.token_service import get_access_token,get_refreshed_access_token
from BaseApp.services.agent_init_services.init_scan_service import store_scanned_data
from BaseApp.services.agent_monitoring.main_endpoint import agent_monitor
from BaseApp.services.agent_monitoring.disk_partition_patch import updation_unknown_disk_partition
from BaseApp.services.agent_monitoring.networkport_patch import updation_unknown_networkport

from BaseApp.services.webapp_services.user_register_login_services.webuser_registration import register_web_user
from BaseApp.services.webapp_services.user_register_login_services.webuser_login import login_web_user
from BaseApp.services.webapp_services.user_register_login_services.send_email_to_verify_webuser import sendemail_to_verify_user
from BaseApp.services.webapp_services.user_register_login_services.send_email_to_reset_password import sendemail_to_reset_password
from BaseApp.services.webapp_services.user_register_login_services.webuser_password_update import update_password
from BaseApp.services.webapp_services.user_register_login_services.webuser_email_validation import check_email
from BaseApp.services.webapp_services.user_register_login_services.webuser_username_validation import check_username
from BaseApp.services.webapp_services.user_register_login_services.verify_reset_password_token import verify_reset_password_token
from BaseApp.services.webapp_services.user_register_login_services.webuser_profile_update import update_web_user
from BaseApp.services.webapp_services.user_register_login_services.get_all_webusers import get_all_users
from BaseApp.services.webapp_services.user_register_login_services.delete_webuser import delete_web_user
from BaseApp.services.webapp_services.dashboard_service import web_dashboard
from BaseApp.services.webapp_services.user_register_login_services.webuser_logout import logout_view

from BaseApp.services.webapp_services.user_permissions.get_assigned_permissions import get_user_permissions
from BaseApp.services.webapp_services.user_permissions.get_available_permissions import get_available_permissions
from BaseApp.services.webapp_services.user_permissions.update_user_permissions import update_user_permissions

from BaseApp.services.webapp_services.get_all_device_details import get_all_device_details, get_device_by_uuid
from BaseApp.services.webapp_services.cpu_utilization_service import cpu_utilization
from BaseApp.services.webapp_services.memory_utilization_service import memory_utilization
from BaseApp.services.webapp_services.network_utilization import network_utilization
from BaseApp.services.webapp_services.custum_groups_services.group_service import save_user_groups
from BaseApp.services.webapp_services.custum_groups_services.get_user_groups import get_user_groups
from BaseApp.services.webapp_services.custum_groups_services.delete_user_group import delete_user_group
from BaseApp.services.webapp_services.custum_groups_services.user_authentication import JWTCookieAuthentication


#Flagged services imports
from BaseApp.services.webapp_services.flogged_component_services.disk_flag_service import flagged_storage_devices
from BaseApp.services.webapp_services.flogged_component_services.port_flag_service import flagged_port_devices

# CSV Validation Service Import
from BaseApp.services.webapp_services.csv_filedata_services.csv_data_validation import csvdata_validation

#alert filter imports
from BaseApp.services.webapp_services.alert_filter_services.custom_range_filter import filtered_alerts_by_custom_range
from BaseApp.services.webapp_services.alert_filter_services.alert_filter_option import filtered_alerts_by_options
from BaseApp.services.webapp_services.alert_filter_services.read_alerts import make_alerts_as_read
from BaseApp.services.webapp_services.alert_filter_services.mark_all_alerts_read import make_all_alerts_as_read
from BaseApp.services.webapp_services.alert_filter_services.unread_alerts_count import get_unread_alerts_count

#event logs filter imports
from BaseApp.services.webapp_services.eventlogs_filter_services.filter_events_by_custom import filtered_eventlogs_by_custom_range
from BaseApp.services.webapp_services.eventlogs_filter_services.filter_events_by_option import filtered_events_by_option

from rest_framework.decorators import api_view, permission_classes,throttle_classes,authentication_classes
from rest_framework.permissions import AllowAny
import re
from datetime import datetime, timedelta, date
from django.utils import timezone
from django.utils.timezone import now
from rest_framework.throttling import UserRateThrottle
from django.core.cache import cache
import logging
from rest_framework.response import Response
from asgiref.sync import async_to_sync
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.utils.timezone import now, localtime
from BaseApp.models import CPU, Storage, Memory,MemoryMonitoring,PendingDeletion
# cpu stats service imports
from BaseApp.services.webapp_services.stats.cpu_stats_services.cpu_minutely_stats import cpu_minutely_stats
from BaseApp.services.webapp_services.stats.cpu_stats_services.cpu_hourly_stats import cpu_hourly_stats
from BaseApp.services.webapp_services.stats.cpu_stats_services.cpu_daily_stats import cpu_daily_stats   
from BaseApp.services.webapp_services.stats.cpu_stats_services.cpu_weekly_stats import cpu_weekly_stats 
from BaseApp.services.webapp_services.stats.cpu_stats_services.cpu_monthly_stats import cpu_monthly_stats
from BaseApp.services.webapp_services.stats.cpu_stats_services.cpu_custom_range_stats import cpu_custom_range_stats
# memory stats service imports
from BaseApp.services.webapp_services.stats.memory_stats_services.memory_minutely_stats import memory_minutely_stats    
from BaseApp.services.webapp_services.stats.memory_stats_services.memory_hourly_stats import memory_hourly_stats
from BaseApp.services.webapp_services.stats.memory_stats_services.memory_daily_stats import memory_daily_stats
from BaseApp.services.webapp_services.stats.memory_stats_services.memory_weekly_stats import memory_weekly_stats
from BaseApp.services.webapp_services.stats.memory_stats_services.memory_monthly_stats import memory_monthly_stats
from BaseApp.services.webapp_services.stats.memory_stats_services.memory_custom_range_stats import memory_custom_range_stats

# disk stats service imports
from BaseApp.services.webapp_services.stats.disk_stats_services.disk_minutely_stats import disk_minutely_stats  
from BaseApp.services.webapp_services.stats.disk_stats_services.disk_hourly_stats import disk_hourly_stats
from BaseApp.services.webapp_services.stats.disk_stats_services.disk_daily_stats import disk_daily_stats
from BaseApp.services.webapp_services.stats.disk_stats_services.disk_weekly_stats import disk_weekly_stats
from BaseApp.services.webapp_services.stats.disk_stats_services.disk_monthly_stats import disk_monthly_stats
from BaseApp.services.webapp_services.stats.disk_stats_services.disk_custom_range_stats import disk_custom_range_stats


# views.py
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

logger = logging.getLogger(__name__)

# ===== EXISTING VIEWS =====

@api_view(["POST"])
@permission_classes([AllowAny])
def agent_onboard_view(request):
    """Function-based view to handle agent creation via service."""
    return create_agent(request)

@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def access_token_view(request):
    """Function-based view to handle access token via service."""
    return get_access_token(request)

@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def refresh_access_token_view(request):
    return get_refreshed_access_token(request)

@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def store_scan_data_view(request):
    """Endpoint to receive and store scan data."""
    return store_scanned_data(request)

@csrf_exempt
def agent_monitroing_view(request): 
   return async_to_sync(agent_monitor)(request)

@api_view(["PATCH"])
@authentication_classes([])
@permission_classes([AllowAny]) 
def handle_unknown_disk_partition_view(request,device_uuid):
    return updation_unknown_disk_partition(request,device_uuid)

@api_view(["PATCH"])
@authentication_classes([])
@permission_classes([AllowAny]) 
def handle_unknown_networkport_view(request,device_uuid):
    return updation_unknown_networkport(request,device_uuid)
       
@api_view(["POST"])
@permission_classes([AllowAny])
def webuser_registration_view(request):
    return register_web_user(request)
   
@api_view(['POST'])
@permission_classes([AllowAny])
def web_user_login_view(request):
    return  login_web_user(request)

@api_view(['PATCH'])
@permission_classes([AllowAny])
def update_user_details(request,id):
    return update_web_user(request,id)

@api_view(['POST'])
@permission_classes([AllowAny])
def email_validation(request):
    return  check_email(request)

@api_view(['POST'])
@permission_classes([AllowAny])
def username_validatuion_view(request):
    return  check_username(request)

@api_view(['POST'])
@permission_classes([AllowAny])
def sendemail_to_resetpassword_view(request):
    return sendemail_to_reset_password(request)

@api_view(['GET'])
@permission_classes([AllowAny])
def verify_reset_password_view(request):
    return verify_reset_password_token(request)
    
@api_view(['PATCH'])
@permission_classes([AllowAny])
def update_password_view(request):
    """Function to update the password of a user."""
    return update_password(request)

@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email_view(request,token):     
    return sendemail_to_verify_user(request, token)  # Assuming this function handles email verification as well

@api_view(["GET"])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated]) 
def get_all_user_details(request):
    return get_all_users(request)

@api_view(["DELETE"])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])     
def delete_user_details(request,id):
    return delete_web_user(request,id)

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def dashboard_view(request):
    return web_dashboard(request)  # Assuming this function handles the dashboard view logic

@api_view(['POST'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def logout(request):
   return logout_view(request)  # Assuming this function handles user logout logic

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def all_devicedata_view(request):
    return get_all_device_details(request)  # Assuming this function retrieves all device details

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def get_device_by_uuid_view(request, uuid):
    return get_device_by_uuid(request,uuid) 
 
@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def cpu_utilization_view(request, uuid):
    return cpu_utilization(request, uuid)  
  
@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def memory_utilization_view(request, uuid):
    return memory_utilization(request, uuid)  # Assuming this function retrieves memory utilization dat

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def network_utilization_view(request, uuid):
    return network_utilization(request, uuid)  # Assuming this function retrieves network utilization data

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])  
def get_availabe_permissions_view(request):
    return get_available_permissions(request)     

@api_view(['GET'])      
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def get_user_permissions_view(request, userId):
    return get_user_permissions(request, userId)

@api_view(['POST'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def update_user_permissions_view(request, userId):
    return update_user_permissions(request, userId)  

@api_view(['POST'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])  
def save_user_groups_view(request):
    return save_user_groups(request)

@api_view(['GET'])  
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def get_user_groups_view(request):
    return get_user_groups(request)

@api_view(['DELETE'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def delete_user_groups_view(request, group_id):
    return delete_user_group(request, group_id)


# ======================== CPU VIEWS ========================
@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def cpu_hourly_stats_view(request, agent_uuid):
    return cpu_hourly_stats(request, agent_uuid)

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def cpu_daily_stats_view(request, agent_uuid):
    return cpu_daily_stats(request, agent_uuid)

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def cpu_minutely_stats_view(request, agent_uuid):
    return cpu_minutely_stats(request, agent_uuid) 

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def cpu_weekly_stats_view(request, agent_uuid):
    return cpu_weekly_stats(request, agent_uuid) 

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def cpu_monthly_stats_view(request, agent_uuid):
    return cpu_monthly_stats(request, agent_uuid)   

@api_view(['POST'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def cpu_custom_range_stats_view(request, agent_uuid):
    return cpu_custom_range_stats(request, agent_uuid)

# ======================== MEMORY VIEWS ========================

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def memory_minutely_stats_view(request, agent_uuid):
    return memory_minutely_stats(request, agent_uuid)

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def memory_hourly_stats_view(request, agent_uuid):
    return memory_hourly_stats(request, agent_uuid)

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def memory_daily_stats_view(request, agent_uuid):
    return memory_daily_stats(request, agent_uuid)

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def memory_weekly_stats_view(request, agent_uuid):
    return memory_weekly_stats(request, agent_uuid)

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def memory_monthly_stats_view(request, agent_uuid):
    return memory_monthly_stats(request, agent_uuid)

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def memory_custom_range_stats_view(request, agent_uuid):
    return memory_custom_range_stats(request, agent_uuid)
# ======================== DISK VIEWS ========================
@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def disk_minutely_stats_view(request, agent_uuid):
    return disk_minutely_stats(request, agent_uuid)

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def disk_hourly_stats_view(request, agent_uuid):
    return disk_hourly_stats(request, agent_uuid)

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def disk_daily_stats_view(request, agent_uuid):
    return disk_daily_stats(request, agent_uuid)

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def disk_monthly_stats_view(request, agent_uuid):
    return disk_monthly_stats(request, agent_uuid) 

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def disk_weekly_stats_view(request, agent_uuid):
    return disk_weekly_stats(request, agent_uuid)  


@api_view(['POST'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def disk_custom_range_stats_view(request, agent_uuid):
    return disk_custom_range_stats(request, agent_uuid)

# ======================== Flag views ========================
@api_view(['GET', 'PATCH']) 
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def flagged_storage_view(request):
    return flagged_storage_devices(request)

@api_view(['GET', 'PATCH']) 
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def flagged_port_view(request):
    return flagged_port_devices(request)    
    
# ===== ✅ CSV DEVICE IMPORT VIEWS =====
logger = logging.getLogger("agent_monitoring")
@api_view(["POST"])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def validate_csv_view(request):
    return csvdata_validation(request)
    
# ======================== AGENT VERIFICATION VIEW ========================   
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def agent_verification(request):
    """
    Single API endpoint for agent to verify disk/partition existence.
    
    Expected payload:
    {
        "entity_uuid": "74d4104d-9342-45da-b084-9eb55274a7c6",
        "device_uuid": "a1b2c3d4-5e6f-7890-abcd-ef1234567890", 
        "entity_type": "disk",
        "exists": true  // or false
    }
    """
    try:
        entity_uuid = request.data.get('entity_uuid')
        device_uuid = request.data.get('device_uuid')
        entity_type = request.data.get('entity_type')
        exists = request.data.get('exists')
        
        # Validate required fields
        if not all([entity_uuid, device_uuid, entity_type]) or exists is None:
            return Response({
                'error': 'Missing required fields: entity_uuid, device_uuid, entity_type, exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate entity_type
        if entity_type not in ['disk', 'partition']:
            return Response({
                'error': 'Invalid entity_type. Must be "disk" or "partition"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the pending deletion record
        try:
            pending_deletion = PendingDeletion.objects.get(
                uuid=entity_uuid,
                device_uuid=device_uuid,
                entity_type=entity_type,
                flagged=True,
                verification_status='pending'
            )
        except PendingDeletion.DoesNotExist:
            return Response({
                'error': 'No pending verification found for this entity'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update verification status based on existence
        verification_result = 'exists' if exists else 'not_exists'
        pending_deletion.verification_status = verification_result
        pending_deletion.save()
        
        logger.info(f"Agent verification: {entity_type} {entity_uuid} {'exists' if exists else 'does not exist'}")
        
        # Return response with next action info
        if exists:
            message = f"{entity_type.capitalize()} confirmed as existing - will be restored"
            next_action = "restore"
        else:
            message = f"{entity_type.capitalize()} confirmed as missing - will be kept in pending deletion"
            next_action = "keep_in_pending"
        
        return Response({
            'message': message,
            'entity_uuid': entity_uuid,
            'entity_type': entity_type,
            'exists': exists,
            'verification_result': verification_result,
            'next_action': next_action,
            'status': 'success'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error processing agent disk verification: {str(e)}")
        return Response({
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

# =============================== Alert filter view =================================
@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def filtered_alerts_view(request):
   return filtered_alerts_by_custom_range(request)

@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def alert_filter_options_view(request):
    return filtered_alerts_by_options(request)

# =============================== EventLog filter view =================================
@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def filtered_eventlogs_view(request):
    return filtered_eventlogs_by_custom_range(request)

@api_view(['GET'])  
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def eventlog_filter_options_view(request):
    return filtered_events_by_option(request)

# ======================== Alert Read/Unread Views ========================
@api_view(['PATCH'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def mark_alert_read_view(request):
   return make_alerts_as_read(request)

@api_view(['PATCH'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def mark_all_alerts_read_view(request):
    return make_all_alerts_as_read(request)

# Optional: Get unread alerts count
@api_view(['GET'])
@authentication_classes([JWTCookieAuthentication])
@permission_classes([IsAuthenticated])
def unread_alerts_count_view(request):
   return get_unread_alerts_count(request)