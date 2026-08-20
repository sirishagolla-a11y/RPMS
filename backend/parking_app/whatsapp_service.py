import os
import datetime
from django.utils import timezone


def send_payment_reminder(customer, subscription):
    """Send a WhatsApp reminder using the configured Business API credentials if available."""
    token = os.getenv('WHATSAPP_TOKEN')
    phone_number_id = os.getenv('WHATSAPP_PHONE_NUMBER_ID')

    if not token or not phone_number_id:
        return True

    try:
        import requests
    except ImportError:
        return False

    month_name = datetime.datetime.strptime(f'2000-{subscription.month}-01', '%Y-%m-%d').strftime('%B')
    message = (
        f"Hello {customer.owner_name},\n\n"
        f"Your railway parking monthly pass payment for {month_name} is pending.\n\n"
        f"Vehicle:\n{customer.vehicle_number}\n\n"
        f"Amount:\n₹{subscription.amount}\n\n"
        f"Please complete payment."
    )

    payload = {
        'messaging_product': 'whatsapp',
        'to': customer.phone_number,
        'type': 'text',
        'text': {'body': message},
    }

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }
    url = f'https://graph.facebook.com/v18.0/{phone_number_id}/messages'

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        return response.status_code in [200, 201]
    except Exception:
        return False
