from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from ....models import GlobalConfig
import logging
import json
from BaseApp.utils import check_permission
from django.utils.decorators import method_decorator
from rest_framework.permissions import IsAuthenticated
from BaseApp.utils import JWTCookieAuthentication
from BaseApp.models.base_audit_model import BaseAuditModel
logger = logging.getLogger("agent_monitoring")

# Keys that should be masked when returning to clients

def bulk_update_configs(request,config_dict):

    updated = []
    validation_errors = []
    validated_data = {}

    
    cleaned_dict = {
        key: value
        for key, value in config_dict.items()
    }

    # Step 2 — Validate the remaining values
    for key, value in cleaned_dict.items():
        is_valid, error_msg, cleaned_value = GlobalConfig.validate_config(key, value)

        if not is_valid:
            validation_errors.append({
                "key": key,
                "value": value,
                "error": error_msg
            })
        else:
            validated_data[key] = cleaned_value

    if validation_errors:
        return 0, validation_errors

    # Step 3 — Update only existing configs
    for key, value in validated_data.items():
        try:
            config = GlobalConfig.objects.get(item_key=key)
            config.item_value = value
            config.save(request=request,update_fields=["item_value"])
            updated.append(key)

        except GlobalConfig.DoesNotExist:
            validation_errors.append({
                "key": key,
                "error": f"Configuration '{key}' does not exist."
            })
        except Exception as e:
            validation_errors.append({
                "key": key,
                "error": str(e)
            })

    return len(updated), validation_errors

class GlobalConfigView(APIView):
    """
    GET: returns nested config reconstructed from key-value rows.
    PATCH: accepts nested JSON and updates/creates key-value rows.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes= [JWTCookieAuthentication]
    @method_decorator(check_permission(module='global_configuration', allowed_action='read'))
    def get(self, request):
        # Reconstruct nested config from all DB rows
        entries = GlobalConfig.objects.all()
        flat = {e.item_key: e.item_value for e in entries}
        
        # Mask sensitive values
        return Response(flat, status=status.HTTP_200_OK)
    
    @method_decorator(check_permission(module='global_configuration', allowed_action='update'))
    @transaction.atomic
    def patch(self, request):

        config_data = request.data
        user = request.user
        logger.info(f"Received config update request: {config_data}")
        updated_count, errors = bulk_update_configs(request,config_data)

        if errors:
            return Response({
                "success": False,
                "message": "configurations failed to update.",
                "errors": errors
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "success": True,
            "message": "configurations updated successfully.",
            "summary": {
                "updated": updated_count
            }
        }, status=status.HTTP_200_OK)
