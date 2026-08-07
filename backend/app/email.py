import logging
import smtplib
from email.message import EmailMessage

from app.config import settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, body: str) -> bool:
    """
    Best-effort send. Never raises: callers are endpoints that must not reveal
    whether an address exists, so a delivery failure has to look like success.
    """
    if not settings.smtp_host:
        logger.warning(
            "SMTP is not configured, email not sent.\nTo: %s\nSubject: %s\n%s",
            to,
            subject,
            body,
        )
        return False

    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            if settings.smtp_tls:
                server.starttls()
            if settings.smtp_user:
                server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(message)
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to)
        return False
