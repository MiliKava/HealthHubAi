from playwright.sync_api import sync_playwright
import time
import os

# Create images directory
os.makedirs("../frontend/public/images", exist_ok=True)

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = context.new_page()
    
    # 1. Take Landing Page
    print("Navigating to landing page...")
    page.goto("http://localhost:5173/")
    time.sleep(3) # Wait for animations and images to load (they will be broken for a second but playwright will capture anyway, wait I can't take landing page if the images on it are broken! I should take it last!)

    # 2. Register
    print("Registering new user...")
    page.goto("http://localhost:5173/register")
    time.sleep(1)
    
    unique_email = f"test_{int(time.time())}@example.com"
    page.fill("input[name='fullName']", "Test User")
    page.fill("input[name='email']", unique_email)
    page.fill("input[name='password']", "password123")
    page.click("button[type='submit']")
    time.sleep(2)
    
    # 3. Dashboard
    print("Navigating to dashboard...")
    page.goto("http://localhost:5173/dashboard")
    page.wait_for_selector("text=Dashboard") 
    time.sleep(2)
    print("Taking dashboard screenshot...")
    page.screenshot(path="../frontend/public/images/dashboard-preview.png")
    
    # 4. Triage
    print("Taking triage screenshot...")
    page.goto("http://localhost:5173/triage")
    time.sleep(2)
    page.fill("input[placeholder='Type your response...']", "I have a severe headache and nausea")
    page.click("button:has-text('Send')")
    time.sleep(10) # Wait for AI response
    page.screenshot(path="../frontend/public/images/triage-preview.png")
    
    # 5. Doctors
    print("Taking doctors screenshot...")
    page.goto("http://localhost:5173/doctors")
    time.sleep(3)
    page.screenshot(path="../frontend/public/images/doctors-preview.png")

    # 6. NOW take Landing Page (since inner images are restored)
    print("Navigating to landing page again...")
    page.goto("http://localhost:5173/")
    time.sleep(3) 
    print("Taking landing page screenshot...")
    page.screenshot(path="../frontend/public/images/landing-preview.png", full_page=True)

    context.close()
    browser.close()
    print("Done!")

with sync_playwright() as playwright:
    run(playwright)
