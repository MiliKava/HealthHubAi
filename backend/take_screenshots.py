from playwright.sync_api import sync_playwright
import time
import os

# Create images directory
os.makedirs("../frontend/public/images", exist_ok=True)

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = context.new_page()
    
    print("Registering new user...")
    # Register a new user to ensure login
    page.goto("http://localhost:5173/register")
    time.sleep(1)
    
    # Use a unique email to avoid conflicts
    unique_email = f"test_{int(time.time())}@example.com"
    page.fill("input[name='fullName']", "Test User")
    page.fill("input[name='email']", unique_email)
    page.fill("input[name='password']", "password123")
    page.click("button[type='submit']")
    time.sleep(3) # Wait for dashboard to load
    
    print("Taking dashboard screenshot...")
    page.screenshot(path="../frontend/public/images/dashboard-preview.png")
    
    print("Taking triage screenshot...")
    page.goto("http://localhost:5173/triage")
    time.sleep(2)
    page.fill("input[placeholder='Type your response...']", "I have a severe headache and nausea")
    page.click("button:has-text('Send')")
    time.sleep(10) # Wait for AI response
    page.screenshot(path="../frontend/public/images/triage-preview.png")
    
    print("Taking doctors screenshot...")
    page.goto("http://localhost:5173/doctors")
    time.sleep(3)
    page.screenshot(path="../frontend/public/images/doctors-preview.png")

    context.close()
    browser.close()
    print("Done!")

with sync_playwright() as playwright:
    run(playwright)
