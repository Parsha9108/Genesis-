
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import IntegrityError
from BaseApp.utils import JWTCookieAuthentication
from ....models import WebUser,Role
from ....serializer import WebUserSerializer,UserUpdateSerializer
import logging
from django.db import transaction
import uuid
from django.conf import settings
import jwt
import datetime
from urllib.parse import quote # Assume this is a custom email service module
from BaseApp.utils import check_permission
from django.utils.decorators import method_decorator
from django.contrib.auth.hashers import make_password
from BaseApp.services.webapp_services.email_notifications.Emailtemplates import EmailTemplates
from BaseApp.services.webapp_services.email_notifications.Sendemail_service import EmailService
logger = logging.getLogger("agent_monitoring")
def generate_email_token(user):
    """Generate secure email verification token"""
    payload = {
        "user_id": str(user.id),
        "email": user.email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
        "iat": datetime.datetime.utcnow(),
        "purpose": "email_verification"
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
def _track_changes(user, new_data, raw_password=None):
    """
    Track what changed in the user update  
    Args:
        user: Current user object before changes
        new_data: Dictionary of new values
        raw_password: New password if provided
        
    Returns:
        dict: Changes dictionary with old and new values
    """
    changes = {}
    change_time = datetime.datetime.now().strftime('%B %d, %Y at %I:%M %p')
    
    # Track password change
    if raw_password:
        changes['password'] = {
            'old': None,  # Don't expose old password
            'new': '********',  # Mask new password
            'time': change_time
        }
    
    # Track role change
    if 'role' in new_data:
        new_role_uuid = new_data['role']
        try:
            new_role = Role.objects.get(uuid=new_role_uuid)
            old_role_name = user.role.role_name if hasattr(user, 'role') else 'N/A'
            new_role_name = new_role.role_name
            
            if old_role_name != new_role_name:
                changes['role'] = {
                    'old': old_role_name,
                    'new': new_role_name,
                    'time': change_time
                }
        except Role.DoesNotExist:
            pass
    
    # Track is_active change
    if 'is_active' in new_data:
        new_is_active = bool(new_data['is_active'])
        if user.is_active != new_is_active:
            changes['is_active'] = {
                'old': user.is_active,
                'new': new_is_active,
                'time': change_time
            }
    
    # Track is_email_verified change
    if 'is_email_enabled' in new_data:
        new_is_email_enabled = bool(new_data['is_email_enabled'])
        if user.is_email_enabled != new_is_email_enabled:
            changes['is_email_enabled'] = {
                'old': user.is_email_enabled,
                'new': new_is_email_enabled,
                'time': change_time
            }
    
    # Track email change
    if 'email' in new_data and user.email != new_data['email']:
        changes['email'] = {
            'old': user.email,
            'new': new_data['email'],
            'time': change_time
        }
    
    # Track username change
    if 'username' in new_data and user.username != new_data['username']:
        changes['username'] = {
            'old': user.username,
            'new': new_data['username'],
            'time': change_time
        }
    
    return changes
class UserManageView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes= [JWTCookieAuthentication]
    @method_decorator(check_permission(module='users_management', allowed_action='read'))
    def get(self, request):

        users = WebUser.objects.all()
        logger.info(f"Retrieved {users} users from database.")
        serializer = WebUserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    @method_decorator(check_permission(module='users_management', allowed_action='create'))
    def post(self, request):
        """Enhanced user registration with professional email system"""

        try:
            logger.info(f"User registration attempt: {request.data}")
            
            role = request.data.get('role')
            raw_password = request.data.get("password")
            email_verification_enabled = str(request.data.get('is_email_enabled')).strip().lower() in ['true', '1', 'yes']

            logger.info(f"require_email_enabled={email_verification_enabled}")

            logger.info(f"Requested role: {role}")

            # Validate required fields
            if not raw_password:
                return Response({
                    'success': False,
                    'error': 'Password is required',
                    'code': 'MISSING_PASSWORD'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create user with serializer
            serializer = WebUserSerializer(data=request.data)
            
            if not serializer.is_valid():
                logger.error(f"User validation failed: {serializer.errors}")
                return Response({
                    'success': False,
                    'errors': serializer.errors,
                    'code': 'VALIDATION_ERROR'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Save user
            user = serializer.save()
            
            
            # Set first-login based on role name (fix comparison)
            role_name = getattr(user.role, 'role_name', None)  # adjust to your Role model field (name/role_name)
            
            if role_name in ["Administrator","Global User","Administrator (ReadOnly)"]:
                user.is_first_login = False
                logger.info(f"Admin user created: {user.username}")
            else:
                user.is_first_login = True
                logger.info(f"Regular user created: {user.username}")
            
            user.save(update_fields=['is_first_login'])
            
            logger.info(f"User saved: {user.username} (Role: {user.role.role_name if user.role else 'None'})")

            # Send appropriate email based on role
            email_success = False
            email_message = ""
            
         
            if email_verification_enabled:
                token = quote(generate_email_token(user))
                verify_url = f"https://192.168.100.92/app/verify-email/{token}/"
                logger.info(f"Verification URL generated for {user.username}")

                try:
                    
                    html_content, plain_text,subject=EmailTemplates.get_user_verification_email(user, verify_url, raw_password)
                
                    email_success = EmailService.send_email([user.email],html_content, plain_text,subject)
                
                except Exception as e:
                    email_success = False
                    email_message = str(e)
                    logger.warning(f"Email send error for {user.email}: {email_message}", exc_info=True)

            # Prepare successful response
            response_data = {
                'success': True,
                'message': 'User registered successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': {
                        'uuid': str(getattr(user.role, 'uuid', '')) or None,
                        'role_name': role_name
                    },
                    'is_first_login': user.is_first_login
                },
                'verification': {
                    'required': email_verification_enabled,
                }
            }
            
            # logger.info(f"Registration completed successfully for {user.username}")
            logger.info(f"Sending response: {response_data}")

            if email_verification_enabled and not email_success:
                # keep user inactive, but surface a clear warning
                response_data['warning'] = 'User created but verification email delivery failed'
                logger.warning(f"User created but email failed for {user.username}: {email_message}")

            # logger.info(f"Sending response for {user.username}")
            return Response(response_data, status=status.HTTP_201_CREATED)
        
        except IntegrityError as e:
            msg = str(e)
            error_message = 'User with this email or username already exists'
            if 'username' in msg.lower():
                error_message = 'Username already exists'
            elif 'email' in msg.lower():
                error_message = 'Email already exists'
            return Response({'success': False, 'error': error_message, 'code': 'DUPLICATE_USER'},
                            status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'success': False, 'error': f'An unexpected error occurred: {e}', 'code': 'INTERNAL_ERROR'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
     
    # helper to coerce booleans (accepts real bools or strings)
    @method_decorator(check_permission(module='users_management', allowed_action='update'))
    def patch(self,request):
       
        logger.info(f"Update request data: {request.data}")
        try:
            # If client sends "ids": [<uuid>, ...] and "role": "<role_uuid>", treat as bulk role assignment
            ids = request.data.get("id")
            if ids is None:
                return Response({"error": "'id' is required (string or list of UUIDs)"},
                                status=status.HTTP_400_BAD_REQUEST)

            # normalize ids to a list
            if isinstance(ids, str):
                ids = [ids]
            elif not isinstance(ids, list):
                return Response({"error": "Invalid 'id' format - must be string or list"},
                                status=status.HTTP_400_BAD_REQUEST)

            # Build validated UUID list
            valid_ids = []
            for v in ids:
                try:
                    valid_ids.append(uuid.UUID(str(v)))
                except (TypeError, ValueError):
                    logger.warning(f"Invalid UUID skipped: {v}")

            if not valid_ids:
              return Response({"error": "No valid UUIDs provided"}, status=status.HTTP_400_BAD_REQUEST)
  
            # Validate role exists
            users_qs = WebUser.objects.filter(id__in=valid_ids)
            users_map = {str(u.id): u for u in users_qs}

            missing = [str(i) for i in valid_ids if str(i) not in users_map]
            if missing:
                # if you prefer to continue, change this to warning and skip those ids
                return Response({"error": f"Users not found for ids: {missing}"}, status=status.HTTP_404_NOT_FOUND)

            # If frontend passes role as UUID, resolve Role object once (if provided)
            role_uuid = request.data.get("role")
            role_obj = None
            if role_uuid is not None:
                try:
                    # adjust to use uuid or pk depending on your Role model
                    role_obj = Role.objects.get(uuid=role_uuid)
                except Role.DoesNotExist:
                    return Response({"error": f"Role not found: {role_uuid}"}, status=status.HTTP_404_NOT_FOUND)

           
            shared_payload = request.data.copy()
            # If is_active and is_email_verified from frontend, convert to serializer fields
            if "is_active" in shared_payload:
                shared_payload["is_active"] = bool(shared_payload.pop("is_active"))
            elif "is_email_enabled" in shared_payload:
                # change key to model/serializer field name; update if different
                shared_payload["is_email_enabled"] = bool(shared_payload.pop("is_email_enabled"))
            elif 'email' in shared_payload:
                shared_payload['email'] = str(shared_payload['email']).strip()
            elif 'username' in shared_payload:
                shared_payload['username'] = str(shared_payload['username']).strip()
            raw_password = None
            if "password" in shared_payload:
                raw_password = shared_payload.pop("password")

            # If role resolved, set the actual Role instance (serializer should accept it or role_id)
            if role_obj is not None:
                shared_payload["role"] = str(role_obj.uuid) if hasattr(role_obj, "uuid") else role_obj.pk

            results = []
            for uid_str, user in users_map.items():
                try:
                    # ✅ Track changes BEFORE updating
                    changes_dict = _track_changes(user, shared_payload, raw_password)
                    
                    # Check if any changes were made
                    if not changes_dict:
                        results.append({
                            "id": uid_str,
                            "username": user.username,
                            "status": "no_changes",
                            "message": "No changes detected",
                            "changes": {}
                        })
                        logger.info(f"No changes for user {uid_str}")
                        continue
                    
                    # Prepare user-specific payload
                    user_payload = shared_payload.copy()
                    
                    # Hash password if provided
                    if raw_password:
                        user_payload["password"] = make_password(raw_password)
                    
                    # Validate and save
                    serializer = UserUpdateSerializer(user, data=user_payload, partial=True)
                    
                    if serializer.is_valid():
                        with transaction.atomic():
                            updated_user = serializer.save()
                        
                        # ✅ Send email with changes
                        try:
                            if updated_user.is_email_enabled == True:
                                if 'is_active' in changes_dict or 'role' in changes_dict or 'password' in changes_dict or 'username' in changes_dict:
                                    html_content, plain_content,subject = EmailTemplates.send_account_update_email (
                                        user=updated_user,
                                        changes_dict=changes_dict,
                                    )
                                    
                                    success, message = EmailService.send_email(
                                        [updated_user.email], html_content, plain_content,subject,
                                    )
                                    
                                    email_message = message
                                
                                elif 'email' in changes_dict:
                                    # Store new email temporarily
                                    new_email = changes_dict['email']['new']
                                    updated_user.is_email_verified = False  # Mark as unverified
                                    updated_user.is_active = False  # Suspend account until verified
                                    updated_user.save() 
                                    logger.info(f"Pending email set for {user.username}: {new_email}")
                                    token = quote(generate_email_token(updated_user))
                                    verify_url = f"https://192.168.100.92/app/verify-email/{token}/"
                                    logger.info(f"🔗 Verification URL generated for {user.username}")

                                    try:
                                        subject, html_content, plain_content = EmailTemplates.send_email_change_verification(
                                        user=updated_user,
                                        new_email=new_email,
                                        old_email=changes_dict['email']['old'],
                                        verification_link=verify_url )

                                        success,message=EmailService.send_email(
                                           [updated_user.email], html_content, plain_content,subject,
                                        )
                                        email_message = message
                                    except Exception as e:
                                        logger.error(f"Failed to send verification email: {e}")
                            else:
                                email_message = "Email not sent - user email is not enabled."

                        except Exception as email_error:
                            logger.error(f"Email error for {uid_str}: {email_error}")
                            email_status = "error"
                            email_message = str(email_error)
                        
                        # Build detailed result with changes
                        results.append({
                            "id": uid_str,
                            "username": updated_user.username,
                            "email": updated_user.email,
                            "status": "updated",
                            "message": f"User {updated_user.username} updated successfully",
                            "email_notification": {
                                "status": "success",
                                "message": email_message
                            }
                        })
                        
                        logger.info(f"✅ User {uid_str} updated: {list(changes_dict.keys())}")
                        
                    else:
                        results.append({
                            "id": uid_str,
                            "username": user.username,
                            "status": "validation_error",
                            "errors": serializer.errors,
                            "changes": {}
                        })
                        logger.warning(f"❌ Validation error for {uid_str}: {serializer.errors}")
                
                except Exception as exc:
                    logger.error(f"❌ Error updating user {uid_str}: {exc}", exc_info=True)
                    results.append({
                        "id": uid_str,
                        "username": user.username if user else "unknown",
                        "status": "error",
                        "error": str(exc),
                        "changes": {}
                    })
            updated_count = sum(1 for r in results if r.get("status") == "updated")

            return Response({
                "success": True,
                "updated_count": updated_count,
                "results": results
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)    
    @method_decorator(check_permission(module='users_management', allowed_action='delete'))
    def delete(self, request):
        try:   
            # Extract 'id' field (could be a single ID or a list)
            ids = request.data.get('id')
            logger.info("ids",ids)
             # ✅ Normalize into a list correctly
            if isinstance(ids, str):
                # Single UUID string → wrap in list
                ids = [ids]
            elif not isinstance(ids, list):
                return Response(
                {"error": "Invalid ID format — must be a string or a list of strings"},
                status=status.HTTP_400_BAD_REQUEST
            )
            valid_ids = []
            
            for id_value in ids:
                try:
                    valid_ids.append(uuid.UUID(str(id_value)))
                except (ValueError, TypeError):
                    logger.warning(f"Invalid UUID skipped: {id_value}")

            if not valid_ids:
                return Response(
                    {"error": "No valid UUIDs provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ✅ Perform bulk delete
            users = WebUser.objects.filter(id__in=valid_ids)
            if not users.exists():
                return Response(
                    {"error": "No matching users found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            usernames = list(users.values_list('username', flat=True))
            count = users.count()
            users.delete()

            logger.info(f"✅ Deleted {count} user(s): {usernames}")

            return Response(
                {
                    "success": True,
                    "message": f"{count} user(s) deleted successfully",
                    "deleted_users": usernames
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

