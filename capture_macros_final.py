import asyncio
from playwright.async_api import async_playwright

async def capture_screenshots():
    async with async_playwright() as p:
        print("Launching browser...")
        browser = await p.chromium.launch(headless=False)

        context = await browser.new_context(
            viewport={'width': 390, 'height': 844},
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

            # Scroll specifically to show macro cards
            print("Scrolling to macro cards (attempt 1)...")
            await page.evaluate('window.scrollTo(0, 550)')
            await page.wait_for_timeout(2000)

            print("Capturing macro cards view 1...")
            await page.screenshot(path='C:\\Users\\derri\\HeirclarkHealthAppNew\\macros_view1.png')
            print("Screenshot saved: macros_view1.png")

            # Try a different scroll position
            print("Scrolling to macro cards (attempt 2)...")
            await page.evaluate('window.scrollTo(0, 650)')
            await page.wait_for_timeout(2000)

            print("Capturing macro cards view 2...")
            await page.screenshot(path='C:\\Users\\derri\\HeirclarkHealthAppNew\\macros_view2.png')
            print("Screenshot saved: macros_view2.png")

            # Try another scroll position
            print("Scrolling to macro cards (attempt 3)...")
            await page.evaluate('window.scrollTo(0, 500)')
            await page.wait_for_timeout(2000)

            print("Capturing macro cards view 3...")
            await page.screenshot(path='C:\\Users\\derri\\HeirclarkHealthAppNew\\macros_view3.png')
            print("Screenshot saved: macros_view3.png")

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
