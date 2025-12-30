from django.urls import path
from .views import *
from .services.webapp_services.user_management.user_details import *
from .services.webapp_services.user_register_login_services.webuser_login_logout import web_user_login_view,web_user_logout_view
from .services.webapp_services.user_register_login_services.webuser_username_email_validation import check_username,check_email
from .services.webapp_services.user_register_login_services.send_email_and_verify_to_reset_password import sendemail_to_reset_password,verify_reset_password_token
from .services.webapp_services.user_management.user_roles import RolesManageView
from .services.webapp_services.user_management.UserManageView import UserManageView
from .services.webapp_services.global_config.global_config_view import GlobalConfigView
from .services.webapp_services.email_notifications.smtp_test_config import test_email_configuration
from .services.webapp_services.audit_logs.audit_logs_view import get_audit_logs,get_audit_log_filters,download_audit_logs


# from .services.webapp_services.user_management.UserManageView import updatepassword
urlpatterns =[
    path('onboard/',agent_onboard_view,name='agent_view'),
    path('get/jwt/',access_token_view,name="tokens"),
    path('init/data/',store_scan_data_view,name="initdata"),
    path('init/data/<str:device_uuid>/disk/',handle_unknown_disk_partition_view,name='update_partition'),
    path('init/data/<str:device_uuid>/nic/',handle_unknown_networkport_view,name='update_nic_port'),
    path('get/jwt/access_token/',refresh_access_token_view,name="get_access_token"),
    path('bridge/',agent_monitroing_view,name="agent_monitoring"),

    path('signup/check-email/',check_email, name='check-email'),
    path('signup/check-username/', check_username, name='check-username'),
    path('register/reset-password/', sendemail_to_reset_password, name='send-reset-password'),
    path('register/verify-reset-passowrd-token/', verify_reset_password_token, name='verify-email'),
    path("password-reset/", update_password_view, name="password-reset"),
    path('register/verify-email/<str:token>/', verify_email_view, name='verify-email'),
    path('signin/', web_user_login_view, name='login'),

    path('get/logged-in-user-details/', get_logged_in_user_details, name='get-logged-in-user-details'),
    path('logout/', web_user_logout_view, name='logout'), 
    
    path('devicedata/',all_devicedata_view, name='all_devicedata'),
    path('device/<uuid:uuid>/', get_device_by_uuid_view, name='get_device_by_uuid'),
    path('device/cpu-utilization/<uuid:uuid>/', cpu_utilization_view, name='cpu_utilization'),
    path('device/memory-utilization/<uuid:uuid>/', memory_utilization_view, name='memory_utilization'),
    path('device/network-utilization/<uuid:uuid>/', network_utilization_view, name='network_utilization'),
    #CPU Stats Endpoints
    path("cpu/<uuid:agent_uuid>/stats/hourly/", cpu_hourly_stats_view),
    path("cpu/<uuid:agent_uuid>/stats/daily/", cpu_daily_stats_view),
    path("cpu/<uuid:agent_uuid>/stats/weekly/", cpu_weekly_stats_view),
    path("cpu/<uuid:agent_uuid>/stats/monthly/", cpu_monthly_stats_view),
    path("cpu/<uuid:agent_uuid>/stats/custom-range/",cpu_custom_range_stats_view),
    path("cpu/<uuid:agent_uuid>/stats/minutely/", cpu_minutely_stats_view),
    #Storage Stats Endpoints
    path("disk/<uuid:agent_uuid>/stats/hourly/", disk_hourly_stats_view),
    path("disk/<uuid:agent_uuid>/stats/daily/", disk_daily_stats_view),
    path("disk/<uuid:agent_uuid>/stats/weekly/", disk_weekly_stats_view),
    path("disk/<uuid:agent_uuid>/stats/monthly/", disk_monthly_stats_view),
    path("disk/<uuid:agent_uuid>/stats/minutely/", disk_minutely_stats_view),
    path("disk/<uuid:agent_uuid>/stats/custom-range/", disk_custom_range_stats_view),
    #Memory Stats Endpoints
    path("memory/<uuid:agent_uuid>/stats/hourly/", memory_hourly_stats_view),  
    path("memory/<uuid:agent_uuid>/stats/daily/", memory_daily_stats_view),
    path("memory/<uuid:agent_uuid>/stats/weekly/", memory_weekly_stats_view),
    path("memory/<uuid:agent_uuid>/stats/monthly/", memory_monthly_stats_view),
    path("memory/<uuid:agent_uuid>/stats/minutely/", memory_minutely_stats_view),
    path("memory/<uuid:agent_uuid>/stats/custom-range/", memory_custom_range_stats_view),
    #custom groups endpoints
    path ('groups/configuration/',save_user_groups_view,name="save_user_groups"),
    path ('get_groups/', get_user_groups_view, name='get_user_groups'),
    path( 'delete_group/<str:group_id>/', delete_user_groups_view, name='delete_user_groups'),
    #csv validation endpoint
    path('validate-csv/',validate_csv_view, name='validate_and_process_csv'),
    path('agent/verification/', agent_verification, name='agent_verification'),
    # flagged services
    path("flagged_storage_devices/", flagged_storage_view, name="flagged-storage"),
    path("flagged_ports/", flagged_port_view, name="flagged-network-ports"),
    
    
    #alert filter 
    path('alerts/filtered/', filtered_alerts_view, name='filtered-alerts'),
    path('alerts/filter-options/', alert_filter_options_view, name='alert-filter-options'),
    #Event_logs filter 
    path('eventlogs/filtered/', filtered_eventlogs_view, name='filtered_eventlogs'),
    path('eventlogs/filter-options/', eventlog_filter_options_view, name='eventlog_filter_options'),
    
    #Alert_viewed 
    path('alerts/mark-read/', mark_alert_read_view, name='mark_alert_read'),
    path('alerts/mark-all-read/', mark_all_alerts_read_view, name='mark_all_alerts_read'),
    path('alerts/unread-count/', unread_alerts_count_view, name='unread_alerts_count'),

    path('modules/permissions/all', get_user_permission_set, name='get_user_permission_set'),
    path('modules/permissions/', get_module_permission, name='get_module_permission'),
    
    # Test URL
    path('request/user/', test_request_user),

    path('roles/', RolesManageView.as_view(), name='roles-manage'),

    # UserManageView
    path('user/manage/', UserManageView.as_view(), name='user-manage'),
 
    # GlobalConfigView
    path('globalconfig/',GlobalConfigView.as_view(),name='config'),

    path('test-smtp-config/', test_email_configuration,name='test-smtp-config'),

    #audit_logs
    path('get_auditlogs/',get_audit_logs,name="audit_logs"),
    path('get_filter_options/',get_audit_log_filters,name="filter_options"),
    path('audit_logs/download/', download_audit_logs, name='audit-logs-download'),

]

   
    



webappurlpatterns =[

    # path('monitoring/charts/', mon_charts_request_handler_view, name='mon-charts-request-handler'),
    # path('component-uuid-pair/<uuid:agent_uuid>/<str:component_type>/', get_component_objects_details_view, name='component-uuid-pair'),
]

# agenturlpatterns =[
#     # AgentView
#     path('v1/https/agent/', AgentView.as_view(), name='agent-view'),
# ]