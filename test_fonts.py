import asyncio
from playwright.async_api import async_playwright

async def test_fonts():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 430, 'height': 932})
        page = await context.new_page()

        # Try common Expo ports
        for port in [8081, 8082, 19006, 19000]:
            try:
                await page.goto(f"http://localhost:{port}", timeout=5000)
                print(f"Connected to port {port}")
                break
            except:
                continue

        # Wait for app to render
        await page.wait_for_timeout(3000)

        # Take screenshot
        await page.screenshot(path="C:\\Users\\derri\\HeirclarkHealthAppNew\\font_test_result.png")
        print("Screenshot saved to font_test_result.png")

        await browser.close()

asyncio.run(test_fonts())
