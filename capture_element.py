import asyncio
from playwright.async_api import async_playwright

async def capture_screenshots():
    async with async_playwright() as p:
        print("Launching browser...")
        browser = await p.chromium.launch(headless=False)

        context = await browser.new_context(
            viewport={'width': 390, 'height': 1200},  # Taller viewport
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True,
        )

        page = await context.new_page()

        try:
            print("Navigating to Expo app...")
            await page.goto('http://localhost:8081', wait_until='networkidle', timeout=60000)

            print("Waiting for app to load...")
            await page.wait_for_timeout(8000)

            # Skip onboarding
            print("Looking for Skip button...")
            skip_button = await page.query_selector('text=Skip')
            if skip_button:
                print("Found Skip button, clicking...")
                await skip_button.click()
                await page.wait_for_timeout(3000)

            # Take full page screenshot with taller viewport
            print("Capturing full page with tall viewport...")
            await page.screenshot(path='C:\\Users\\derri\\HeirclarkHealthAppNew\\full_page_tall.png', full_page=False)
            print("Screenshot saved: full_page_tall.png")

            print("\nScreenshot captured successfully!")
            print("Location: C:\\Users\\derri\\HeirclarkHealthAppNew\\")

        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await browser.close()

if __name__ == '__main__':
    asyncio.run(capture_screenshots())
