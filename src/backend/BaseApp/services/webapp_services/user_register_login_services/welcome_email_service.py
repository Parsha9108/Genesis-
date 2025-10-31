# BaseApp/email_service.py
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from .welcome_email_templates import (
    get_admin_email_template,
    get_plain_text_admin_email,
    get_user_email_template,
    get_plain_text_user_email
)
import logging

logger = logging.getLogger(__name__)

class EmailService:
    """Professional email service for user management"""
    
    @staticmethod
    def send_admin_verification_email(user, verify_url):
        """Send professional admin verification email"""
        try:
            subject = f"🛡️ Admin Account Verification Required - {settings.COMPANY_NAME if hasattr(settings, 'COMPANY_NAME') else 'System'}"
            
            # HTML content
            html_content = get_admin_email_template(user, verify_url)
            
            # Plain text fallback
            text_content = get_plain_text_admin_email(user, verify_url)
            
            # Create email
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=f"{getattr(settings, 'COMPANY_NAME', 'System')} <{settings.DEFAULT_FROM_EMAIL}>",
                to=[user.email],
                headers={
                    'X-Priority': '1',  # High priority for admin emails
                    'X-Mailer': 'Django Admin System',
                }
            )
            
            # Attach HTML version
            email.attach_alternative(html_content, "text/html")
            
            # Send email
            result = email.send(fail_silently=False)
            
            if result:
                logger.info(f"✅ Admin verification email sent successfully to {user.email}")
                return True, "Admin verification email sent successfully"
            else:
                logger.error(f"❌ Failed to send admin verification email to {user.email}")
                return False, "Failed to send verification email"
                
        except Exception as e:
            logger.error(f"❌ Error sending admin verification email to {user.email}: {str(e)}")
            return False, f"Email error: {str(e)}"
    
    @staticmethod
    def send_user_welcome_email(user, verify_url, raw_password):
        """Send professional user welcome email with credentials"""
        try:
            subject = f"Welcome to {getattr(settings, 'COMPANY_NAME', 'Our Platform')} - Account Created"
            
            # HTML content
            html_content = get_user_email_template(user, verify_url, raw_password)
            
            # Plain text fallback
            text_content = get_plain_text_user_email(user, verify_url, raw_password)
            
            # Create email
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=f"{getattr(settings, 'COMPANY_NAME', 'System')} <{settings.DEFAULT_FROM_EMAIL}>",
                to=[user.email],
                headers={
                    'X-Mailer': 'Django User System',
                    'X-Account-Type': user.role,
                }
            )
            
            # Attach HTML version
            email.attach_alternative(html_content, "text/html")
            
            # Send email
            result = email.send(fail_silently=False)
            
            if result:
                logger.info(f"✅ Welcome email sent successfully to {user.email}")
                return True, "Welcome email sent successfully"
            else:
                logger.error(f"❌ Failed to send welcome email to {user.email}")
                return False, "Failed to send welcome email"
                
        except Exception as e:
            logger.error(f"❌ Error sending welcome email to {user.email}: {str(e)}")
            return False, f"Email error: {str(e)}"
