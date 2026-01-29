import asyncio
import time
from playwright.async_api import async_playwright

async def capture_screenshots():
    async with async_playwright() as p:
        print("Launching browser...")
        browser = await p.chromium.launch(headless=False)

        context = await browser.new_context(
            viewport={'width': 390, 'height': 844},  # iPhone 14 Pro dimensions
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

            # Try to skip onboarding if present
            print("Looking for Skip button...")
            skip_button = await page.query_selector('text=Skip')
            if skip_button:
                print("Found Skip button, clicking...")
                await skip_button.click()
                await page.wait_for_timeout(3000)

            # Look for "Already have an account? Log In" link
            login_link = await page.query_selector('text=Log In')
            if login_link:
                print("Found Log In link, clicking...")
                await login_link.click()
                await page.wait_for_timeout(3000)

            # Try to find and click the home/calorie counter tab
            print("Looking for home tab...")
            await page.wait_for_timeout(2000)

            print("Capturing full page screenshot...")
            await page.screenshot(path='C:\\Users\\derri\\HeirclarkHealthAppNew\\calorie_counter_page.png', full_page=True)
            print("Screenshot saved: calorie_counter_page.png")

            # Try to scroll down to see more cards
            print("Scrolling down...")
            await page.evaluate('window.scrollTo(0, 800)')
            await page.wait_for_timeout(2000)

            print("Capturing scrolled view...")
            await page.screenshot(path='C:\\Users\\derri\\HeirclarkHealthAppNew\\calorie_counter_scrolled.png', full_page=True)
            print("Screenshot saved: calorie_counter_scrolled.png")

            # Scroll back up to see the macro cards
            print("Scrolling up to see macro cards...")
            await page.evaluate('window.scrollTo(0, 300)')
            await page.wait_for_timeout(2000)

            print("Capturing macro cards view...")
            await page.screenshot(path='C:\\Users\\derri\\HeirclarkHealthAppNew\\macro_cards_view.png', full_page=True)
            print("Screenshot saved: macro_cards_view.png")

            print("\nScreenshots captured successfully!")
            print("Location: C:\\Users\\derri\\HeirclarkHealthAppNew\\")

        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await browser.close()

if __name__ == '__main__':
    asyncio.run(capture_screenshots())
