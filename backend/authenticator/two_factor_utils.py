import random
import threading
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from .models import TwoFactorAuthCode


# Development/Testing flag - set to False to actually send emails
SKIP_EMAIL_SEND = False  # Set to False to actually send emails via Gmail


def generate_otp():
    """Generate a random 6-digit OTP code"""
    return str(random.randint(100000, 999999))


def send_otp_email(user, otp_code):
    """
    Send OTP code to user's email via Gmail SMTP (non-blocking)
    Uses no-reply email address
    Runs in a background thread to avoid blocking the login request
    """
    def _send_email():
        # Skip actual email sending if in test mode
        if SKIP_EMAIL_SEND:
            print(f"\n{'='*60}")
            print(f"[TEST MODE] OTP EMAIL SKIPPED")
            print(f"User: {user.email_add}")
            print(f"OTP Code: {otp_code}")
            print(f"Expires in: 10 minutes")
            print(f"{'='*60}\n")
            return
        
        subject = "Your 2FA Authentication Code"
        
        # HTML email template with styled OTP box
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #f5f5f5;
                }}
                .email-box {{
                    background: white;
                    border-radius: 8px;
                    padding: 40px;
                    text-align: center;
                }}
                .header {{
                    color: #1f2937;
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }}
                .subheader {{
                    color: #6b7280;
                    font-size: 16px;
                    margin-bottom: 30px;
                }}
                .otp-box {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    padding: 30px;
                    margin: 30px 0;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }}
                .otp-label {{
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 14px;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }}
                .otp-code {{
                    color: white;
                    font-size: 48px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    font-family: 'Courier New', monospace;
                    margin: 20px 0;
                }}
                .otp-expires {{
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 13px;
                    margin-top: 10px;
                }}
                .info-box {{
                    background: #f0f9ff;
                    border-left: 4px solid #3b82f6;
                    padding: 15px;
                    margin: 20px 0;
                    text-align: left;
                    border-radius: 4px;
                }}
                .info-text {{
                    color: #1e40af;
                    font-size: 14px;
                    margin: 5px 0;
                }}
                .footer {{
                    color: #9ca3af;
                    font-size: 12px;
                    margin-top: 30px;
                    border-top: 1px solid #e5e7eb;
                    padding-top: 20px;
                }}
                .rkms-logo {{
                    color: #667eea;
                    font-weight: bold;
                    font-size: 14px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="email-box">
                    <div class="header">RKMS</div>
                    <div class="subheader">Two-Factor Authentication</div>
                    
                    <p style="color: #4b5563; font-size: 15px; margin-bottom: 20px;">
                        Hello <strong>{user.first_name}</strong>,
                    </p>
                    
                    <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
                        Your authentication code is:
                    </p>
                    
                    <div class="otp-box">
                        <div class="otp-label">Enter This Code</div>
                        <div class="otp-code">{otp_code}</div>
                        <div class="otp-expires">⏱️ Valid for 10 minutes</div>
                    </div>
                    
                    <div class="info-box">
                        <div class="info-text">🔒 Never share this code with anyone</div>
                        <div class="info-text">🔒 We will never ask for your code via email</div>
                        <div class="info-text">🔒 This code expires in 10 minutes</div>
                    </div>
                    
                    <p style="color: #9ca3af; font-size: 13px; margin-top: 30px;">
                        If you did not request this code, please ignore this email. Your account is secure.
                    </p>
                    
                    <div class="footer">
                        <p>Best regards,</p>
                        <p class="rkms-logo">RKMS System</p>
                        <p style="margin-top: 10px;">Record Keeping Management System</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        plain_text_message = f"""
Hello {user.first_name},

Your authentication code is: {otp_code}

This code will expire in 10 minutes. Please do not share this code with anyone.

If you did not request this code, please ignore this email.

Best regards,
RKMS System
        """
        
        try:
            send_mail(
                subject,
                plain_text_message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email_add],
                html_message=html_message,
                fail_silently=False
            )
            print(f"✓ OTP email sent successfully to {user.email_add}")
        except Exception as e:
            print(f"\n{'='*60}")
            print(f"✗ FAILED TO SEND OTP EMAIL")
            print(f"To: {user.email_add}")
            print(f"From: {settings.DEFAULT_FROM_EMAIL}")
            print(f"Host: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
            print(f"User: {settings.EMAIL_HOST_USER}")
            print(f"Error: {str(e)}")
            print(f"{'='*60}\n")
            import traceback
            traceback.print_exc()
    
    # Send email in background thread so it doesn't block the login response
    email_thread = threading.Thread(target=_send_email, daemon=True)
    email_thread.start()
    return True  # Return True immediately, email sends in background


def create_and_send_otp(user):
    """
    Create a new OTP code and send it to the user's email (non-blocking)
    Returns the OTP code if created successfully, None if error
    """
    try:
        # Generate OTP code
        otp_code = generate_otp()
        
        # Calculate expiration time (10 minutes from now)
        expires_at = timezone.now() + timedelta(minutes=10)
        
        # Create OTP record in database
        two_fa_code = TwoFactorAuthCode.objects.create(
            user=user,
            code=otp_code,
            expires_at=expires_at
        )
        
        # Send email in background (non-blocking)
        send_otp_email(user, otp_code)
        
        print(f"✓ OTP code created for user {user.user_id}: {otp_code}")
        return otp_code
    except Exception as e:
        print(f"✗ Error creating OTP for user {user.user_id}: {str(e)}")
        return None


def verify_otp(user, otp_code):
    """
    Verify if the provided OTP code is valid for the user
    Returns tuple: (is_valid, message)
    """
    try:
        # Get the most recent OTP for this user
        two_fa_code = TwoFactorAuthCode.objects.filter(user=user).latest('created_at')
    except TwoFactorAuthCode.DoesNotExist:
        return False, "No OTP code found. Please request a new code."
    
    # Check if OTP is expired
    if two_fa_code.is_expired:
        return False, "OTP code has expired. Please request a new code."
    
    # Check if OTP is already used
    if two_fa_code.is_used:
        return False, "OTP code has already been used."
    
    # Check if max attempts exceeded
    if two_fa_code.attempts >= 3:
        return False, "Maximum verification attempts exceeded. Please request a new code."
    
    # Increment attempts
    two_fa_code.attempts += 1
    two_fa_code.save()
    
    # Verify the code
    if two_fa_code.code == otp_code:
        # Mark as used
        two_fa_code.is_used = True
        two_fa_code.used_at = timezone.now()
        two_fa_code.save()
        return True, "OTP verified successfully."
    
    return False, f"Invalid OTP code. {3 - two_fa_code.attempts} attempts remaining."


def clean_expired_otps():
    """
    Clean up expired OTP codes from database
    Can be run periodically via a scheduled task
    """
    expired_codes = TwoFactorAuthCode.objects.filter(expires_at__lt=timezone.now())
    count = expired_codes.count()
    expired_codes.delete()
    return count
