import time
import requests
import os

# Backend Django endpoint configuration
DJANGO_API_URL = os.getenv("DJANGO_API_URL", "http://127.0.0.1:8000/api/sessions/ai_check/")

# Optional Mock imports description
# import cv2
# import torch # for YOLOv8/v9/v10
# import easyocr

def main():
    print("====================================================")
    print("RPMS COMPUTER VISION / CCTV ANPR SERVICE STARTING")
    print("====================================================")
    print("Dependencies required: OpenCV, YOLO, EasyOCR/PaddleOCR")
    print(f"Targeting Django API check: {DJANGO_API_URL}")
    print("----------------------------------------------------\n")

    # Mock plate list for simulation
    plates_to_simulate = [
        {"plate": "AP39AB1234", "desc": "Simulating Active Monthly Member Vehicle"},
        {"plate": "MH12AB5678", "desc": "Simulating Casual Customer Vehicle"}
    ]

    for vehicle in plates_to_simulate:
        plate_str = vehicle["plate"]
        desc = vehicle["desc"]
        
        print(f"[CCTV Feed] Processing frame...")
        print(f"[YOLO Object Detection] Locating vehicle and license plate...")
        time.sleep(1)
        print(f"[OCR Recognition] Reading characters: {plate_str} ({desc})")
        
        # Send data to Django API
        try:
            payload = {"vehicle_number": plate_str}
            response = requests.post(DJANGO_API_URL, json=payload, timeout=5)
            
            if response.status_code == 200:
                res_data = response.json()
                print(f"[Django API Response] Status: {response.status_code}")
                if res_data.get("is_monthly"):
                    print("  >> [SYSTEM NOTIFICATION] MONTHLY PASS ACTIVE!")
                    print(f"  >> Owner: {res_data.get('owner_name')} | Receipt: {res_data.get('receipt_number')}")
                    print("  >> Action: Open gate automatically. No billing required.")
                else:
                    print("  >> [SYSTEM NOTIFICATION] CASUAL VEHICLE DETECTED.")
                    print(f"  >> Entry Session Created. Receipt: {res_data.get('receipt_number')}")
                    print("  >> Action: Open gate and print casual parking slip.")
            else:
                print(f"[Django API Error] Response code: {response.status_code}, Body: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"[Connection Error] Could not connect to Django API: {e}")
            
        print("-" * 50)
        time.sleep(2)

if __name__ == "__main__":
    main()
