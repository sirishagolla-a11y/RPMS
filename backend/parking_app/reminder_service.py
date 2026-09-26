import os
import re
import requests
from django.utils import timezone
import datetime
from .models import MonthlyPass, ReminderLog

def get_whatsapp_config():
    return {
        "access_token": os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip(),
        "phone_number_id": os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip(),
        "business_account_id": os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID", "").strip(),
        "api_version": os.getenv("WHATSAPP_API_VERSION", "v19.0").strip(),
        "template_name": os.getenv("WHATSAPP_TEMPLATE_NAME", "pass_expiry_reminder").strip(),
        "template_lang": os.getenv("WHATSAPP_TEMPLATE_LANG", "en_US").strip(),
    }

def sanitize_phone_number(phone_raw):
    """
    Format phone number to international E.164 format required by WhatsApp Graph API.
    e.g. 9876543210 -> 919876543210
    """
    if not phone_raw:
        return ""
    digits = re.sub(r"\D", "", str(phone_raw))
    if len(digits) == 10:
        return "91" + digits  # Default India country code
    elif len(digits) > 10:
        return digits
    return ""

def send_whatsapp_cloud_api(recipient_phone, customer_name, expiry_date_str):
    """
    Official Meta WhatsApp Business Cloud API payload dispatcher.
    """
    config = get_whatsapp_config()
    clean_phone = sanitize_phone_number(recipient_phone)
    
    if not clean_phone:
        return {
            "success": False,
            "status": "INVALID_NUMBER",
            "error": "Invalid or missing phone number format.",
            "message_id": None
        }

    # If credentials are missing, perform safe simulation
    if not config["access_token"] or not config["phone_number_id"]:
        print(f"[WhatsApp API Simulation] Target: {clean_phone} | Customer: {customer_name} | Expiry: {expiry_date_str}")
        return {
            "success": True,
            "status": "SIMULATED",
            "error": "Meta WhatsApp API keys not configured in environment (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID). Simulation mode active.",
            "message_id": f"SIM-{int(timezone.now().timestamp())}"
        }

    url = f"https://graph.facebook.com/{config['api_version']}/{config['phone_number_id']}/messages"
    headers = {
        "Authorization": f"Bearer {config['access_token']}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": clean_phone,
        "type": "template",
        "template": {
            "name": config["template_name"],
            "language": {"code": config["template_lang"]},
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": customer_name},
                        {"type": "text", "text": expiry_date_str}
                    ]
                }
            ]
        }
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        res_json = response.json()
        
        if response.status_code in [200, 201]:
            message_id = res_json.get("messages", [{}])[0].get("id")
            return {
                "success": True,
                "status": "SENT",
                "message_id": message_id,
                "error": None
            }
        else:
            err_msg = res_json.get("error", {}).get("message", response.text)
            return {
                "success": False,
                "status": "FAILED",
                "message_id": None,
                "error": f"Meta API Error ({response.status_code}): {err_msg}"
            }
    except Exception as ex:
        return {
            "success": False,
            "status": "FAILED",
            "message_id": None,
            "error": f"Network Exception: {str(ex)}"
        }

def send_reminder_for_pass(m_pass, reminder_type="MANUAL", force=False):
    """
    Sends WhatsApp reminder for a specific pass record with duplicate checks.
    """
    today = timezone.now().date()
    owner_name = m_pass.vehicle.owner_name or m_pass.vehicle.driver_name or "Valued Customer"
    phone_number = m_pass.whatsapp_number or m_pass.vehicle.phone_number
    expiry_str = m_pass.expiry_date.strftime("%d-%b-%Y")

    if not force:
        # Prevent duplicate reminder for the same pass, reminder_type, and date
        already_sent = ReminderLog.objects.filter(
            pass_record=m_pass,
            reminder_type=reminder_type,
            sent_date=today,
            reminder_status__in=["SENT", "SIMULATED"]
        ).exists()

        if already_sent:
            return {
                "success": False,
                "status": "ALREADY_SENT",
                "message": f"A {reminder_type} reminder was already sent to {owner_name} today."
            }

    msg_text = f"Hello {owner_name}, your monthly parking pass for vehicle {m_pass.vehicle.vehicle_number} expires on {expiry_str}. Please renew your pass to continue using the parking facility."
    
    res = send_whatsapp_cloud_api(phone_number, owner_name, expiry_str)

    log_entry = ReminderLog.objects.create(
        pass_record=m_pass,
        reminder_type=reminder_type,
        message=msg_text,
        reminder_status=res["status"],
        whatsapp_message_id=res.get("message_id"),
        error_message=res.get("error")
    )

    return {
        "success": res["success"],
        "status": res["status"],
        "log_id": log_entry.id,
        "message": msg_text,
        "error": res.get("error")
    }

def send_due_reminders_scan():
    """
    Scans active passes and sends 7-day, 3-day, and 1-day reminders.
    """
    today = timezone.now().date()
    active_passes = MonthlyPass.objects.filter(status="ACTIVE")
    
    results = []
    processed_count = 0
    sent_count = 0
    already_sent_count = 0

    for m_pass in active_passes:
        days_remaining = (m_pass.expiry_date - today).days
        reminder_type = None

        if days_remaining == 7:
            reminder_type = "7_DAY"
        elif days_remaining == 3:
            reminder_type = "3_DAY"
        elif days_remaining == 1 or days_remaining == 0:
            reminder_type = "1_DAY"

        if reminder_type:
            processed_count += 1
            res = send_reminder_for_pass(m_pass, reminder_type=reminder_type, force=False)
            if res["success"]:
                sent_count += 1
            elif res["status"] == "ALREADY_SENT":
                already_sent_count += 1
            
            results.append({
                "pass_id": m_pass.id,
                "vehicle_number": m_pass.vehicle.vehicle_number,
                "days_remaining": days_remaining,
                "reminder_type": reminder_type,
                "result": res
            })

    return {
        "processed": processed_count,
        "sent": sent_count,
        "already_sent": already_sent_count,
        "details": results
    }

def test_whatsapp_configuration():
    """
    Safely tests WhatsApp API environment credentials without sending messages.
    """
    config = get_whatsapp_config()
    is_configured = bool(config["access_token"] and config["phone_number_id"])
    
    return {
        "configured": is_configured,
        "phone_number_id": config["phone_number_id"] if is_configured else "Not set",
        "api_version": config["api_version"],
        "template_name": config["template_name"],
        "template_lang": config["template_lang"],
        "status": "Meta WhatsApp API Configured" if is_configured else "Simulation Mode Active (Missing API Keys)"
    }
