import sys
import os
import logging

# Set up logging to see the output from the service
logging.basicConfig(level=logging.INFO)

# Add the backend directory to sys.path so 'app' can be imported
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.config import settings
from app.services.notification_service import notification_service

print("--- CareBridge AI Email Diagnostics ---")
print(f"Loaded RESEND_API_KEY: {'Yes' if settings.RESEND_API_KEY else 'No'}")
if settings.RESEND_API_KEY:
    print(f"Key starts with: {settings.RESEND_API_KEY[:5]}...")
print(f"EMAIL_FROM: {settings.EMAIL_FROM}")
print("---------------------------------------")

if len(sys.argv) < 2:
    print("\n[ERROR] Please provide the email address you want to send the test to.")
    print("Usage: python test_email.py <your_email@example.com>")
    sys.exit(1)

test_email = sys.argv[1]
print(f"\nAttempting to send a test email to: {test_email} ...\n")

notification_service.send_email(
    to=test_email,
    subject="CareBridge AI - Infrastructure Test",
    html_body="<h2>Success!</h2><p>If you are reading this, your Resend API configuration is working perfectly inside the CareBridge AI backend.</p>"
)

print("\nFinished! Check the logs above. If it says 'Email sent successfully', please check your inbox (and spam folder).")
