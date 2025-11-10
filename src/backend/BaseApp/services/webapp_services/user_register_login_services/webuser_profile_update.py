from django.db import transaction
from rest_framework.response import Response
from rest_framework import status
from ....models import Permission,WebUser,UserPermission
from ....serializer  import UserUpdateSerializer
from django.core.mail import send_mail
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
import logging

logger = logging.getLogger('agent_monitoring')
def update_web_user(request, id):
    logger.info(f"Initiating update for user ID: {id}")
    logger.info(f"Update request data: {request.data}")
    try:
        user = WebUser.objects.get(id=id)
    except WebUser.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    old_role = user.role
    # if user.role.role_name.lower() != 'admin':
    #     admin_id = request.data.get('admin_id')
    #     admin = WebUser.objects.filter(id=admin_id)
    #     print(admin)
    #     admin_email = admin[0].email
    #     admin_name = admin[0].username
    # else:
    #     print("Is self updating")
    
    # # ✅ Determine update scenario
    # is_self_update = user.role == 'admin'
    # is_admin_updating_others = user.role.role_name.lower() != 'Administrator'
    
    old_values = {
        'username': user.username,
        'email': user.email,
        'role': user.role,
    }
    logger.info(f"Old user values: {old_values}")

    serializer = UserUpdateSerializer( user, data=request.data,partial=True  )# Allow partial updates
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # new_values = serializer.validated_data
    # changed_fields = {}

    # for field in ['username', 'email', 'role']:
    #     if field in new_values and new_values[field] != old_values[field]:
    #         changed_fields[field] = {
    #             'old': old_values[field], 
    #             'new': new_values[field]
    #         }

    # if not changed_fields:
    #     return Response({'message': 'No changes detected.'}, status=status.HTTP_200_OK)
    
    # # ✅ Check if role changed and update permissions accordingly
    # role_changed = 'role' in changed_fields
    # new_role = serializer.validated_data.get('role', old_role)
    # # Use transaction to ensure atomic operation
    # with transaction.atomic():
    #     # Save profile updates and new role
    #     serializer.save()

    # try:
    #     if is_self_update:
    #      send_self_update_email(user, changed_fields)
    #     else:
    #      send_admin_updating_others_email(user, changed_fields,admin_name,admin_email)
    # except Exception as e:
    #     logger.error(f"Failed to send email to {user.email}: {str(e)}")
    #     # Continue execution even if email fails
    # Validate data
    if serializer.is_valid():
        # Save updated user
        updated_user = serializer.save()
        
        # Log what changed
        new_values = {
            'username': updated_user.username,
            'email': updated_user.email,
            'role': str(updated_user.role) if updated_user.role else None,
        }
        
        changes = []
        for key in old_values:
            if old_values[key] != new_values[key]:
                changes.append(f"{key}: {old_values[key]} → {new_values[key]}")
        
        logger.info(f"User {id} updated successfully. Changes: {', '.join(changes)}")
        
        return Response(
            {
                'message': 'User updated successfully',
                'data': {
                    'id': updated_user.id,
                    'username': updated_user.username,
                    'email': updated_user.email,
                    'role': {
                        'uuid': str(updated_user.role.uuid) if updated_user.role else None,
                        'role_name': updated_user.role.role_name if updated_user.role else None
                    }
                }
            },
            status=status.HTTP_200_OK
        )
    
    # Validation failed
    logger.error(f"Validation failed for user {id}: {serializer.errors}")
    return Response(
        {
            'error': 'Validation failed',
            'details': serializer.errors
        },
        status=status.HTTP_400_BAD_REQUEST
    )

# def send_self_update_email(user, changed_fields):
#     """Send email when admin updates their own profile""" 
    
#     subject = "🔐 Your Administrator Profile Has Been Updated"
    
#     # ✅ Role-specific styling
#     role_color = get_role_color(user.role)
#     role_icon = get_role_icon(user.role)
    
#     greeting = f"Hello Administrator {user.username},"
#     intro = "You have successfully updated your administrator profile."
    
#     security_note = """
#     <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 5px; margin: 15px 0;">
#         <h4 style="color: #D97706; margin: 0 0 10px 0;">🛡️ Security Notice</h4>
#         <p style="margin: 0; color: #92400E;">As an administrator, please ensure these changes were intentional. 
#         Review your account security regularly and report any unauthorized access immediately.</p>
#     </div>
#     """
    
#     send_formatted_email(user, subject, greeting, intro, changed_fields, security_note, role_color, role_icon)

# def send_admin_updating_others_email(user, changed_fields, admin_name,admin_email):

#     print("entered send_admin_updating_others_email function")
#     print("admin_user",admin_name)
#     """Send email when admin updates another user's profile"""
#     user.role = user.role.role_name.lower()
#     if user.role == 'manager':  # Admin updating another admin
#         subject = "👥 Your Manager Account Has Been Updated"
#         greeting = f"Hello Manager {user.username},"
#         intro = f"Your manager account has been updated by Administrator {admin_name}."
#         security_note = """
#         <div style="background-color: #E0F2FE; border: 1px solid #0EA5E9; padding: 15px; border-radius: 5px; margin: 15px 0;">
#             <h4 style="color: #0284C7; margin: 0 0 10px 0;">ℹ️ Account Update Notice</h4>
#             <p style="margin: 0; color: #075985;">Your manager account has been updated by an administrator. 
#             These changes may affect your management permissions and team access. If you have questions about these changes, 
#             please contact Administrator {admin_name} or your IT support team.</p>
#         </div>
#             """
#     else:  # Regular user, operator, viewer
#         subject = "👤 Your Account Has Been Updated"
#         greeting = f"Hello {user.username},"
#         intro = f"Your account has been updated by Administrator {admin_name}."
#         security_note = """
#         <div style="background-color: #E0F2FE; border: 1px solid #0EA5E9; padding: 15px; border-radius: 5px; margin: 15px 0;">
#             <h4 style="color: #0284C7; margin: 0 0 10px 0;">ℹ️ Account Update</h4>
#             <p style="margin: 0; color: #075985;">Your account information has been updated by an administrator. 
#             If you have questions about these changes, please contact your administrator or IT support team.</p>
#         </div>
#         """
    
#     # ✅ Add admin contact information
#     admin_contact_info = f"""
#     <div style="margin-top: 20px; padding: 15px; background-color: #F1F5F9; border-radius: 5px; border: 1px solid #CBD5E1;">
#         <h4 style="color: #475569; margin: 0 0 10px 0;">👨‍💼 Updated By:</h4>
#         <p style="margin: 5px 0;"><strong>Administrator:</strong> {admin_name}</p>
#         <p style="margin: 5px 0;"><strong>Admin Email:</strong> {admin_email}</p>
#         <p style="margin: 5px 0; color: #64748B; font-size: 12px;">Contact this administrator if you have questions about these changes.</p>
#     </div>
#     """
    
#     role_color = get_role_color(user.role)
#     role_icon = get_role_icon(user.role)
    
#     send_formatted_email(user, subject, greeting, intro, changed_fields, security_note + admin_contact_info, role_color, role_icon)

# def send_formatted_email(user, subject, greeting, intro, changed_fields, security_note, role_color, role_icon):
#     """Send formatted HTML email"""
#     try:
#         # ✅ Build changes HTML
#         changes_html = ""
#         for field, values in changed_fields.items():
#             field_name = field.replace('_', ' ').title()
#             changes_html += f"""
#             <div style="margin: 10px 0; padding: 12px; background-color: #F9FAFB; border-left: 4px solid {role_color}; border-radius: 0 5px 5px 0;">
#                 <strong style="color: #374151; font-size: 14px;">{field_name}:</strong><br>
#                 <div style="margin-top: 8px;">
#                     <span style="color: #6B7280; font-size: 12px;">Previous:</span> 
#                     <code style="background-color: #FEE2E2; color: #991B1B; padding: 3px 8px; border-radius: 4px; font-size: 13px;">{values['old']}</code><br>
#                     <span style="color: #6B7280; font-size: 12px;">Updated to:</span> 
#                     <code style="background-color: #D1FAE5; color: #065F46; padding: 3px 8px; border-radius: 4px; font-size: 13px;">{values['new']}</code>
#                 </div>
#             </div>
#             """

#         # ✅ HTML email template
#         html_content = f"""
#         <!DOCTYPE html>
#         <html>
#         <head>
#             <meta charset="UTF-8">
#             <meta name="viewport" content="width=device-width, initial-scale=1.0">
#             <title>{subject}</title>
#         </head>
#         <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F3F4F6;">
#             <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
#                 <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid {role_color}; padding-bottom: 20px;">
#                     <h1 style="color: {role_color}; margin-bottom: 10px; font-size: 24px;">{role_icon} {subject}</h1>
#                 </div>
                
#                 <div style="margin-bottom: 30px;">
#                     <p style="font-size: 16px;"><strong>{greeting}</strong></p>
#                     <p style="font-size: 15px; color: #4B5563;">{intro}</p>
                    
#                     <h3 style="color: #374151; border-bottom: 2px solid {role_color}; padding-bottom: 10px; margin-top: 25px;">📋 Changes Made:</h3>
#                     {changes_html}
                    
#                     {security_note}
                    
#                     <div style="margin-top: 25px; padding: 20px; background-color: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB;">
#                         <h4 style="color: #475569; margin: 0 0 15px 0; border-bottom: 1px solid {role_color}; padding-bottom: 8px;">📧 Current Account Details:</h4>
#                         <div style="display: flex; flex-wrap: wrap; gap: 15px;">
#                             <div style="flex: 1; min-width: 200px;">
#                                 <p style="margin: 5px 0;"><strong>Username:</strong> {user.username}</p>
#                                 <p style="margin: 5px 0;"><strong>Email:</strong> {user.email}</p>
#                             </div>
#                             <div style="flex: 1; min-width: 200px;">
#                                 <p style="margin: 5px 0;"><strong>Role:</strong> 
#                                     <span style="background-color: {role_color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
#                                         {user.role.upper()}
#                                     </span>
#                                 </p>
#                             </div>
#                         </div>
#                     </div>
#                 </div>
                
#                 <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 12px;">
#                     <p><strong>🏢 Your Application Security Team</strong></p>
#                     <p>📧 Support: <a href="mailto:{settings.DEFAULT_FROM_EMAIL}" style="color: {role_color};">{settings.DEFAULT_FROM_EMAIL}</a></p>
#                     <p style="margin-top: 15px; padding: 10px; background-color: #FEF3C7; border-radius: 5px; color: #92400E;">
#                         This is an automated security notification. Please do not reply to this email.
#                     </p>
#                 </div>
#             </div>
#         </body>
#         </html>
#         """

#         # ✅ Plain text version
#         plain_content = f"""
#         {subject}
        
#         {greeting}
        
#         {intro}
        
#         Changes Made:
#         """
        
#         for field, values in changed_fields.items():
#             field_name = field.replace('_', ' ').title()
#             plain_content += f"- {field_name}: {values['old']} → {values['new']}\n"
        
#         plain_content += f"""
        
#         Current Account Details:
#         - Username: {user.username}
#         - Email: {user.email}
#         - Role: {user.role.upper()}
        
#         If you have any questions, please contact: {settings.DEFAULT_FROM_EMAIL}
        
#         This is an automated security notification. Please do not reply to this email.
#         """

#         # ✅ Send email
#         send_mail(
#             subject=subject,
#             message=plain_content,
#             from_email=settings.DEFAULT_FROM_EMAIL,
#             recipient_list=[user.email],
#             html_message=html_content,
#             fail_silently=False,
#         )
        
#         logger.info(f"Update notification email sent successfully to {user.email} (Role: {user.role})")
        
#     except Exception as e:
#         logger.error(f"Failed to send formatted email to {user.email}: {str(e)}")
#         raise

# def get_role_color(role):
#     """Get color based on user role"""
#     role_colors = {
#         'admin': '#EF4444',      # Red
#         'manager': '#F59E0B',    # Amber/Orange
#         'user': '#3B82F6',       # Blue
#         'operator': '#3B82F6',   # Blue
#         'viewer': '#6B7280',     # Gray
#     }
#     return role_colors.get(role.lower(), '#6B7280')

# def get_role_icon(role):
#     """Get icon based on user role"""
#     role_icons = {
#         'admin': '🔐',
#         'manager': '👥',
#         'user': '👤',
#         'operator': '⚙️',
#         'viewer': '👁️',
#     }
#     return role_icons.get(role.lower(), '👤')