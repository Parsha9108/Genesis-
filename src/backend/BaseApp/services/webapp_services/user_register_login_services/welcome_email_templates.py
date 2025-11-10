# BaseApp/email_templates.py
from django.conf import settings
from datetime import datetime

def get_admin_email_template(user, verify_url):
    """Professional HTML template for admin account verification"""
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Account Verification</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }}
            .content {{ padding: 40px 30px; }}
            .welcome-box {{ background: #f8fafc; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; }}
            .button {{ display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }}
            .button:hover {{ background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%); }}
            .info-card {{ background: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px; padding: 20px; margin: 20px 0; }}
            .footer {{ background: #f7fafc; padding: 30px; text-align: center; color: #718096; font-size: 14px; }}
            .security-note {{ background: #fffbf0; border: 1px solid #fbd38d; border-radius: 8px; padding: 15px; margin: 20px 0; }}
            .warning {{ color: #d69e2e; font-weight: 600; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🛡️ Admin Account Verification</h1>
                <p style="color: #e6fffa; margin: 10px 0 0 0;">Welcome to the Administration Panel</p>
            </div>
            
            <div class="content">
                <div class="welcome-box">
                    <h2 style="margin: 0 0 10px 0; color: #2d3748;">Welcome, {user.username}!</h2>
                    <p style="margin: 0; color: #4a5568;">Your administrator account has been created successfully.</p>
                </div>

                <div class="info-card">
                    <h3 style="margin: 0 0 15px 0; color: #2d3748;">Account Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px 0; font-weight: 600; color: #4a5568;">Username:</td>
                            <td style="padding: 8px 0; color: #2d3748;">{user.username}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px 0; font-weight: 600; color: #4a5568;">Email:</td>
                            <td style="padding: 8px 0; color: #2d3748;">{user.email}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px 0; font-weight: 600; color: #4a5568;">Role:</td>
                            <td style="padding: 8px 0; color: #2d3748;"><strong>{user.role}</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: 600; color: #4a5568;">Created:</td>
                            <td style="padding: 8px 0; color: #2d3748;">{datetime.now().strftime('%B %d, %Y at %I:%M %p')}</td>
                        </tr>
                    </table>
                </div>

                <div class="security-note">
                    <p class="warning" style="margin: 0 0 10px 0;">⚠️ Security Notice</p>
                    <ul style="margin: 0; padding-left: 20px; color: #744210;">
                        <li>This verification link expires in <strong>5 minutes</strong></li>
                        <li>As an admin, you will have full system access</li>
                        <li>Keep your login credentials secure</li>
                        <li>Change your password after first login</li>
                    </ul>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verify_url}" class="button">🔑 Verify & Activate Account</a>
                </div>

                <p style="color: #718096; font-size: 14px; text-align: center; margin: 20px 0;">
                    If the button doesn't work, copy and paste this link:<br>
                    <span style="word-break: break-all; color: #4299e1;">{verify_url}</span>
                </p>
            </div>
            
            <div class="footer">
                <p style="margin: 0 0 10px 0;">© {datetime.now().year} Your Company Name. All rights reserved.</p>
                <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """

def get_user_email_template(user, verify_url, raw_password):
    """Professional HTML template for regular user account creation"""
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome - Account Created</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc; }}
            .container {{ max-width: 500px; margin: 0 auto; background-color: #ffffff; }}
            .header {{ background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 40px 20px; text-align: center; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }}
            .content {{ padding: 40px 30px; }}
            .welcome-box {{ background: #f0fff4; border-left: 4px solid #48bb78; padding: 20px; margin: 20px 0; }}
            .button {{ display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }}
            .button:hover {{ background: linear-gradient(135deg, #38a169 0%, #2f855a 100%); }}
            .credentials-card {{ background: #fffaf0; border: 1px solid #fbd38d; border-radius: 8px; padding: 20px; margin: 20px 0; }}
            .footer {{ background: #f7fafc; padding: 30px; text-align: center; color: #718096; font-size: 14px; }}
            .password-box {{ background: #edf2f7; padding: 15px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 16px; margin: 10px 0; letter-spacing: 1px; }}
            .security-tips {{ background: #e6fffa; border: 1px solid #81e6d9; border-radius: 8px; padding: 15px; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🎉 Welcome Aboard!</h2>
                <p style="color: #e6fffa; margin: 8px 0 0 0;">Your account has been created successfully</p>
            </div>
            
            <div class="content">
                <div class="welcome-box">
                    <h2 style="margin: 0 0 10px 0; color: #2d3748;">Hello, {user.username}!</h2>
                    <p style="margin: 0; color: #4a5568;">Welcome to our platform. Your account has been set up and is ready to use.</p>
                </div>

                <div class="credentials-card">
                    <h3 style="margin: 0 0 15px 0; color: #2d3748;">🔐 Your Login Credentials</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px 0; font-weight: 600; color: #4a5568;">Username:</td>
                            <td style="padding: 10px 0; color: #2d3748;">{user.username}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px 0; font-weight: 600; color: #4a5568;">Email:</td>
                            <td style="padding: 10px 0; color: #2d3748;">{user.email}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px 0; font-weight: 600; color: #4a5568;">Role:</td>
                            <td style="padding: 10px 0; color: #2d3748; text-transform: capitalize;">{user.role}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; font-weight: 600; color: #4a5568;">Temporary Password:</td>
                            <td style="padding: 10px 0;">
                                <div class="password-box">{raw_password}</div>
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="security-tips">
                    <h4 style="margin: 0 0 10px 0; color: #2d3748;">🔒 Security Recommendations</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #4a5568;">
                        <li><strong>Change your password</strong> after first login</li>
                        <li>Use a strong, unique password</li>
                        <li>Never share your login credentials</li>
                        <li>This email contains sensitive information - keep it secure</li>
                    </ul>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <p style="margin: 0 0 15px 0; color: #4a5568;">Click below to verify your email and activate your account:</p>
                    <a href="{verify_url}" class="button">✅ Verify Email & Get Started</a>
                    <p style="color: #e53e3e; font-size: 14px; margin: 10px 0;">⏰ This verification link expires in 15 minutes</p>
                </div>

                <p style="color: #718096; font-size: 14px; text-align: center; margin: 20px 0;">
                    If the button doesn't work, copy and paste this link:<br>
                    <span style="word-break: break-all; color: #4299e1;">{verify_url}</span>
                </p>
            </div>
            
            <div class="footer">
                <p style="margin: 0 0 10px 0;">© {datetime.now().year} Your Company Name. All rights reserved.</p>
                <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
                <p style="margin: 10px 0 0 0; font-size: 12px;">Need help? Contact support at support@yourcompany.com</p>
            </div>
        </div>
    </body>
    </html>
    """

def get_plain_text_admin_email(user, verify_url):
    """Plain text fallback for admin email"""
    return f"""
ADMIN ACCOUNT VERIFICATION REQUIRED

Hello {user.username},

Your administrator account has been created successfully.

Account Details:
- Username: {user.username}
- Email: {user.email}
- Role: {user.role}
- Created: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}

SECURITY NOTICE:
- This verification link expires in 5 minutes
- As an admin, you will have full system access
- Keep your login credentials secure
- Change your password after first login

To verify and activate your account, click this link:
{verify_url}

© {datetime.now().year} Your Company Name
This is an automated message. Please do not reply.
    """

def get_plain_text_user_email(user, verify_url, raw_password):
    """Plain text fallback for user email"""
    return f"""
WELCOME - YOUR ACCOUNT HAS BEEN CREATED

Hello {user.username},

Welcome to our platform! Your account has been created successfully.

Your Login Credentials:
- Username: {user.username}
- Email: {user.email}
- Role: {user.role}
- Temporary Password: {raw_password}

SECURITY RECOMMENDATIONS:
- Change your password after first login
- Use a strong, unique password
- Never share your login credentials
- Keep this email secure

To verify your email and activate your account, click this link:
{verify_url}

IMPORTANT: This verification link expires in 5 minutes.

Need help? Contact support at support@yourcompany.com

© {datetime.now().year} Your Company Name
This is an automated message. Please do not reply.
    """
