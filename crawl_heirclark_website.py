"""
Comprehensive Heirclark.com Website Crawler
Uses Playwright to explore all pages and document functionality
"""
import asyncio
import json
import sys
from playwright.async_api import async_playwright
from datetime import datetime

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

async def crawl_heirclark():
    """Crawl entire heirclark.com website and document all features"""

    results = {
        'crawl_date': datetime.now().isoformat(),
        'base_url': 'https://heirclark.com',
        'pages': [],
        'features': [],
        'components': [],
        'errors': []
    }

    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={'width': 390, 'height': 844},  # iPhone 14 Pro size
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
        )
        page = await context.new_page()

        # Track visited pages
        visited_pages = set()
        pages_to_visit = [
            'https://heirclark.com',
            'https://heirclark.com/pages/calorie-counter',
            'https://heirclark.com/pages/steps',
            'https://heirclark.com/pages/meals',
            'https://heirclark.com/pages/programs',
            'https://heirclark.com/pages/settings',
        ]

        for url in pages_to_visit:
            if url in visited_pages:
                continue

            print(f"\n[CRAWLING] {url}")
            visited_pages.add(url)

            try:
                # Navigate to page
                await page.goto(url, wait_until='networkidle', timeout=30000)
                await page.wait_for_timeout(2000)  # Wait for dynamic content

                page_data = {
                    'url': url,
                    'title': await page.title(),
                    'screenshot': f'screenshots/{url.split("/")[-1] or "home"}.png',
                    'components': [],
                    'buttons': [],
                    'forms': [],
                    'cards': [],
                    'modals': []
                }

                # Take screenshot
                await page.screenshot(path=page_data['screenshot'], full_page=True)

                # Find all interactive elements
                print("  [COMPONENTS] Finding components...")

                # Cards (sections with class containing 'card', 'section', 'container')
                cards = await page.query_selector_all('[class*="card"], [class*="section"], [class*="container"]')
                for card in cards[:20]:  # Limit to first 20
                    try:
                        text = await card.inner_text()
                        if text and len(text.strip()) > 0:
                            # Encode to ASCII, ignoring non-ASCII characters
                            safe_text = text.encode('ascii', 'ignore').decode('ascii').strip()[:200]
                            page_data['cards'].append({
                                'text': safe_text,  # First 200 chars
                                'classes': await card.get_attribute('class')
                            })
                    except Exception:
                        pass  # Skip cards that can't be processed

                # Buttons
                buttons = await page.query_selector_all('button, [role="button"], a[class*="button"]')
                for btn in buttons[:30]:  # Limit to first 30
                    try:
                        text = await btn.inner_text()
                        if text and len(text.strip()) > 0:
                            safe_text = text.encode('ascii', 'ignore').decode('ascii').strip()
                            page_data['buttons'].append({
                                'text': safe_text,
                                'classes': await btn.get_attribute('class')
                            })
                    except Exception:
                        pass  # Skip buttons that can't be processed

                # Forms and inputs
                inputs = await page.query_selector_all('input, textarea, select')
                for inp in inputs:
                    page_data['forms'].append({
                        'type': await inp.get_attribute('type') or 'text',
                        'placeholder': await inp.get_attribute('placeholder') or '',
                        'name': await inp.get_attribute('name') or ''
                    })

                # Check for modals/dialogs
                modals = await page.query_selector_all('[role="dialog"], [class*="modal"], [class*="dialog"]')
                for modal in modals:
                    is_visible = await modal.is_visible()
                    page_data['modals'].append({
                        'visible': is_visible,
                        'classes': await modal.get_attribute('class')
                    })

                # Test interactive features
                print("  🧪 Testing interactions...")

                # Try clicking "Log Meal" button if it exists
                try:
                    log_meal_btn = await page.query_selector('button:has-text("Log Meal")')
                    if log_meal_btn:
                        await log_meal_btn.click()
                        await page.wait_for_timeout(1000)

                        # Check if modal opened
                        modal_visible = await page.is_visible('[role="dialog"]')
                        page_data['components'].append({
                            'name': 'Log Meal Modal',
                            'working': modal_visible,
                            'type': 'modal'
                        })

                        # Close modal
                        close_btn = await page.query_selector('[aria-label*="close"], button:has-text("Cancel")')
                        if close_btn:
                            await close_btn.click()
                            await page.wait_for_timeout(500)
                except Exception as e:
                    print(f"    [WARNING] Log Meal test failed: {e}")

                # Try clicking date selector if it exists
                try:
                    date_btns = await page.query_selector_all('[class*="day"], [class*="date"]')
                    if len(date_btns) > 2:
                        await date_btns[2].click()
                        await page.wait_for_timeout(500)
                        page_data['components'].append({
                            'name': 'Date Selector',
                            'working': True,
                            'type': 'calendar'
                        })
                except Exception as e:
                    print(f"    [WARNING] Date selector test failed: {e}")

                # Try sync button if it exists
                try:
                    sync_btn = await page.query_selector('button:has-text("Sync")')
                    if sync_btn:
                        await sync_btn.click()
                        await page.wait_for_timeout(1000)
                        page_data['components'].append({
                            'name': 'Sync Button',
                            'working': True,
                            'type': 'button'
                        })
                except Exception as e:
                    print(f"    [WARNING] Sync test failed: {e}")

                results['pages'].append(page_data)
                print(f"  [SUCCESS] Completed: {len(page_data['buttons'])} buttons, {len(page_data['cards'])} cards")

            except Exception as e:
                print(f"  [ERROR] Error on {url}: {e}")
                results['errors'].append({
                    'url': url,
                    'error': str(e)
                })

        # Extract overall features from calorie counter page
        print("\n[ANALYZING] Analyzing calorie counter features...")
        try:
            await page.goto('https://heirclark.com/pages/calorie-counter', wait_until='networkidle')
            await page.wait_for_timeout(2000)

            # Check for specific features
            features_to_check = [
                ('Daily Balance', 'Daily Balance'),
                ('Macros', 'Protein'),
                ('Today\'s Meals', 'Breakfast'),
                ('Daily Fat Loss', 'FAT LOSS'),
                ('Weekly Progress', 'WEEKLY PROGRESS'),
                ('Dining Out', 'DINING OUT'),
                ('Wearable Sync', 'WEARABLE SYNC'),
                ('Log Meal', 'Log Meal'),
            ]

            for feature_name, search_text in features_to_check:
                exists = await page.is_visible(f'text="{search_text}"')
                results['features'].append({
                    'name': feature_name,
                    'present': exists
                })
                status = "[YES]" if exists else "[NO]"
                print(f"  {status} {feature_name}")

        except Exception as e:
            print(f"  [ERROR] Feature analysis error: {e}")

        await browser.close()

    # Save results
    with open('website_crawl_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("\n" + "="*60)
    print("[RESULTS] Results saved to: website_crawl_results.json")
    print(f"[SCREENSHOTS] Screenshots saved to: screenshots/")
    print(f"[SUCCESS] Pages crawled: {len(results['pages'])}")
    print(f"[FEATURES] Features found: {len([f for f in results['features'] if f['present']])}/{len(results['features'])}")
    print("="*60)

    return results

if __name__ == '__main__':
    asyncio.run(crawl_heirclark())
