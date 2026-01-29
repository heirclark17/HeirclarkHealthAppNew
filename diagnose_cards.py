import asyncio
from playwright.async_api import async_playwright

async def capture_all_cards():
    async with async_playwright() as p:
        print("Launching browser...")
        browser = await p.chromium.launch(headless=False)

        context = await browser.new_context(
            viewport={'width': 390, 'height': 1400},
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

            # Capture initial view
            print("Capturing initial view...")
            await page.screenshot(path='C:\\Users\\derri\\HeirclarkHealthAppNew\\diagnosis_01_initial.png')

            # Scroll down to see more cards
            print("Scrolling to see Daily Fat Loss card...")
            await page.evaluate('window.scrollTo(0, 800)')
            await page.wait_for_timeout(2000)
            await page.screenshot(path='C:\\Users\\derri\\HeirclarkHealthAppNew\\diagnosis_02_scrolled.png')

            # Try to click on Daily Fat Loss card to expand it
            print("Looking for Daily Fat Loss card...")
            daily_fat_loss = await page.query_selector('text=DAILY FAT LOSS')
            if daily_fat_loss:
                print("Found Daily Fat Loss, clicking to expand...")
                await daily_fat_loss.click()
                await page.wait_for_timeout(1000)
                await page.screenshot(path='C:\\Users\\derri\\HeirclarkHealthAppNew\\diagnosis_03_daily_fat_loss.png')

            # Scroll more and expand Weekly Progress
            print("Scrolling to Weekly Progress...")
            await page.evaluate('window.scrollTo(0, 1200)')
            await page.wait_for_timeout(2000)

            weekly_progress = await page.query_selector('text=WEEKLY PROGRESS')
            if weekly_progress:
                print("Found Weekly Progress, clicking to expand...")
                await weekly_progress.click()
                await page.wait_for_timeout(1000)
                await page.screenshot(path='C:\\Users\\derri\\HeirclarkHealthAppNew\\diagnosis_04_weekly_progress.png')

            # Scroll more and expand Dining Out
            print("Scrolling to Dining Out...")
            await page.evaluate('window.scrollTo(0, 1800)')
            await page.wait_for_timeout(2000)

            dining_out = await page.query_selector('text=DINING OUT')
            if dining_out:
                print("Found Dining Out, clicking to expand...")
                await dining_out.click()
                await page.wait_for_timeout(1000)
                await page.screenshot(path='C:\\Users\\derri\\HeirclarkHealthAppNew\\diagnosis_05_dining_out.png')

            # Scroll more and expand Wearable Sync
            print("Scrolling to Wearable Sync...")
            await page.evaluate('window.scrollTo(0, 2400)')
            await page.wait_for_timeout(2000)

            wearable_sync = await page.query_selector('text=WEARABLE SYNC')
            if wearable_sync:
                print("Found Wearable Sync, clicking to expand...")
                await wearable_sync.click()
                await page.wait_for_timeout(1000)
                await page.screenshot(path='C:\\Users\\derri\\HeirclarkHealthAppNew\\diagnosis_06_wearable_sync.png')

            # Scroll more and expand Today's Meals
            print("Scrolling to Today's Meals...")
            await page.evaluate('window.scrollTo(0, 3000)')
            await page.wait_for_timeout(2000)

            todays_meals = await page.query_selector("text=TODAY'S MEALS")
            if todays_meals:
                print("Found Today's Meals, clicking to expand...")
                await todays_meals.click()
                await page.wait_for_timeout(1000)
                await page.screenshot(path='C:\\Users\\derri\\HeirclarkHealthAppNew\\diagnosis_07_todays_meals.png')

            print("\nAll screenshots captured!")
            print("Location: C:\\Users\\derri\\HeirclarkHealthAppNew\\")

        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await browser.close()

if __name__ == '__main__':
    asyncio.run(capture_all_cards())
