from playwright.sync_api import sync_playwright
import time
import os

# Create images directory
os.makedirs("../frontend/public/images", exist_ok=True)

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    # Give it a nice large desktop viewport
    context = browser.new_context(viewport={'width': 1440, 'height': 900})
    page = context.new_page()
    
    print("Navigating to landing page...")
    page.goto("http://localhost:5173/")
    time.sleep(3) # Wait for animations and images to load
    
    print("Taking landing page screenshot...")
    # Take a full page screenshot to capture all features
    page.screenshot(path="../frontend/public/images/landing-preview.png", full_page=True)
    
    context.close()
    browser.close()
    print("Done!")

with sync_playwright() as playwright:
    run(playwright)
