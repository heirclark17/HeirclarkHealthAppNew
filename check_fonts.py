"""
Playwright script to capture screenshot of Expo app and verify fonts
"""
import asyncio
from playwright.async_api import async_playwright
import os

async def check_app_fonts():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={'width': 430, 'height': 932}  # iPhone dimensions
        )
        page = await context.new_page()

        # Try common Expo web ports
        ports = [8081, 19006, 19000, 8082]
        connected = False

        for port in ports:
            try:
                url = f"http://localhost:{port}"
                print(f"Trying {url}...")
                await page.goto(url, timeout=10000)
                connected = True
                print(f"Connected to {url}")
                break
            except Exception as e:
                print(f"Port {port} not available: {e}")
                continue

        if not connected:
            print("\nCould not connect to Expo app.")
            print("Make sure the app is running with: npx expo start --web")
            await browser.close()
            return

        # Wait for app to load
        print("Waiting for app to load...")
        await page.wait_for_timeout(5000)

        # Take screenshot
        screenshot_path = os.path.join(os.path.dirname(__file__), "font_check_screenshot.png")
        await page.screenshot(path=screenshot_path, full_page=True)
        print(f"\nScreenshot saved to: {screenshot_path}")

        # Keep browser open for manual inspection
        print("\nBrowser will stay open for 30 seconds for manual inspection...")
        print("Check that fonts appear lighter (semiBold instead of bold)")
        await page.wait_for_timeout(30000)

        await browser.close()
        print("Done!")

if __name__ == "__main__":
    asyncio.run(check_app_fonts())
