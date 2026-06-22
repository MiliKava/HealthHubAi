import logging
import resend
from app.core.config import settings

logger = logging.getLogger(__name__)

if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY

class NotificationService:
    @staticmethod
    def send_email(to: str, subject: str, html_body: str):
        if not settings.RESEND_API_KEY:
            logger.warning(f"RESEND_API_KEY not configured. Would have sent email to {to} with subject '{subject}'")
            return
            
        try:
            params = {
                "from": settings.EMAIL_FROM,
                "to": to,
                "subject": subject,
                "html": html_body
            }
            logger.info(f"Sending email to {to} with subject '{subject}'")
            response = resend.Emails.send(params)
            logger.info(f"Email sent successfully. ID: {response.get('id', 'unknown')}")
        except Exception as e:
            logger.error(f"Failed to send email to {to}: {str(e)}")

notification_service = NotificationService()
