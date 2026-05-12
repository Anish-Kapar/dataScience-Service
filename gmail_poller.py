import os
import time
import base64
import requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
CREDENTIALS_FILE = 'credentials.json'
TOKEN_FILE = 'token.json'
FLASK_URL = 'http://localhost:8010/v1/ds/message'
USER_ID = 'gmail_poller'
POLL_INTERVAL = 30   # 30 seconds for testing

BANK_KEYWORDS = ['debited', 'credited', 'spent', 'payment', 'transaction', 
                 'ICICI', 'HDFC', 'SBI', 'Axis', 'Kotak', 'INR', 'Rs.']

def authenticate():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, 'w') as f:
            f.write(creds.to_json())
    return creds

def get_email_body(msg):
    try:
        parts = msg['payload'].get('parts', [])
        if parts:
            for part in parts:
                if part['mimeType'] == 'text/plain':
                    data = part['body']['data']
                    return base64.urlsafe_b64decode(data).decode('utf-8')
        else:
            data = msg['payload']['body']['data']
            return base64.urlsafe_b64decode(data).decode('utf-8')
    except:
        return None

def is_bank_message(text):
    if not text:
        return False
    return any(keyword.lower() in text.lower() for keyword in BANK_KEYWORDS)

def send_to_dsservice(message_text):
    try:
        res = requests.post(
            FLASK_URL,
            json={'message': message_text, 'source': 'gmail'},
            headers={'x-user-id': USER_ID},
            timeout=30
        )
        if res.status_code == 200:
            data = res.json()
            print(f"✓ Saved: {data.get('merchant')} - {data.get('currency')} {data.get('amount')}")
        else:
            print(f"✗ dsService rejected: {res.json()}")
    except Exception as e:
        print(f"✗ Error sending to dsService: {e}")

processed_ids = set()

def poll_gmail(service, last_history_id=None):
    
    
    # Search for recent bank emails
    query = 'subject:(transaction OR debited OR credited OR spent OR payment) newer_than:7d'
    results = service.users().messages().list(userId='me', q=query, maxResults=20).execute()
    messages = results.get('messages', [])
    
    print(f"Found {len(messages)} emails to check")
    
    for msg_ref in messages:
        msg_id = msg_ref['id']
        if msg_id in processed_ids:
            continue
        processed_ids.add(msg_id)
        
        msg = service.users().messages().get(userId='me', id=msg_id, format='full').execute()
        body = get_email_body(msg)
        
        if is_bank_message(body):
            print(f"Bank email detected, sending to dsService...")
            send_to_dsservice(body[:500])  # send first 500 chars

def main():
    print("Starting Gmail poller...")
    creds = authenticate()
    service = build('gmail', 'v1', credentials=creds)
    print("Authenticated with Gmail ✓")
    print(f"Polling every {POLL_INTERVAL} seconds...")
    
    while True:
        try:
            print(f"\n[{time.strftime('%H:%M:%S')}] Checking Gmail...")
            poll_gmail(service)
        except Exception as e:
            print(f"Error: {e}")
        time.sleep(POLL_INTERVAL)

if __name__ == '__main__':
    main()