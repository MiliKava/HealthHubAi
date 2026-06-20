import requests
import json
import time

BASE_URL = "http://localhost:8000"

def get_auth_session():
    # Helper to register and login a test patient to get an authenticated session
    test_email = f"patient_{int(time.time())}@example.com"
    test_password = "password123"
    
    session = requests.Session()
    
    # Register
    reg_data = {"email": test_email, "password": test_password, "full_name": "Test Patient"}
    resp = session.post(f"{BASE_URL}/api/auth/register/patient", json=reg_data)
    if resp.status_code not in [200, 201]:
        print(f"Registration failed: {resp.text}")
        return None
    
    # Login
    login_data = {"username": test_email, "password": test_password}
    resp = session.post(f"{BASE_URL}/api/auth/login", data=login_data)
    
    if resp.status_code == 200:
        return session
    return None

def run_test():
    print("Obtaining patient auth session...")
    session = get_auth_session()
    if not session:
        print("Failed to authenticate. Make sure the server is running and auth routes are available.")
        return

    # Step 1: Start Triage Session
    print("\n--- Starting Triage Session ---")
    resp = session.post(f"{BASE_URL}/api/triage/sessions")
    if resp.status_code != 200:
        print(f"Error creating session: {resp.text}")
        return
    
    session_data = resp.json()
    session_id = session_data["session_id"]
    print(f"Session created with ID: {session_id}")
    print(f"Assistant: {session_data['next_question']}")

    # Simulated Conversation Steps
    conversation = [
        "I have a severe headache and stiff neck.",
        "It started 2 days ago.",
        "I would say it's an 8 out of 10.",
        "I also have a slight fever.",
        "No relevant medical history."
    ]

    for idx, answer in enumerate(conversation):
        print(f"\nUser: {answer}")
        msg_payload = {"content": answer}
        
        resp = session.post(f"{BASE_URL}/api/triage/sessions/{session_id}/message", json=msg_payload)
        if resp.status_code != 200:
            print(f"Error submitting message: {resp.text}")
            return
            
        result_data = resp.json()
        if result_data["is_completed"]:
            print("\n--- Assessment Completed ---")
            print(json.dumps(result_data["result"], indent=2))
        else:
            print(f"Assistant: {result_data['next_question']}")
            
    # Step 3: Fetch Session History
    print("\n--- Fetching Session History ---")
    resp = session.get(f"{BASE_URL}/api/triage/sessions/{session_id}")
    if resp.status_code == 200:
        history = resp.json()
        print(f"Retrieved {len(history['messages'])} messages in history.")
        for msg in history['messages']:
            sender = "User" if msg["sender"] == "user" else "Assistant"
            print(f"{sender} [{msg['step_type']}]: {msg['content']}")
    else:
        print(f"Error fetching history: {resp.text}")

if __name__ == "__main__":
    run_test()
