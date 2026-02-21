#!/usr/bin/env python3
"""Inspect all script tags on the hashtag page."""

import asyncio
import json
import sys
from pathlib import Path
from playwright.async_api import async_playwright, BrowserContext

async def main():
    async with async_playwright() as p:
        # Use Firefox for better stealth
        browser = await p.firefox.launch(headless=False)
        page = await browser.new_page(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0'
        )
        
        # Set stealth properties
        await page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        """)
        
        try:
            url = "https://www.tiktok.com/tag/gym"
            print(f"Loading {url}...")
            await page.goto(url, wait_until='networkidle', timeout=30000)
            await asyncio.sleep(3)
            
            # Get all script tags
            scripts_info = await page.evaluate("""
                () => {
                    const scripts = document.querySelectorAll('script');
                    const results = [];
                    
                    for (let i = 0; i < scripts.length; i++) {
                        const script = scripts[i];
                        const type = script.getAttribute('type') || 'no-type';
                        const src = script.getAttribute('src') || '';
                        const content = script.textContent;
                        
                        const info = {
                            index: i,
                            type: type,
                            src: src,
                            length: content.length,
                            has_default_scope: content.includes('__DEFAULT_SCOPE__'),
                            has_item_list: content.includes('itemList'),
                            has_video: content.includes('videoData') || content.includes('video'),
                            preview: content.substring(0, 150)
                        };
                        
                        results.push(info);
                    }
                    
                    return results;
                }
            """)
            
            print(f"\nFound {len(scripts_info)} script tags:\n")
            
            for script in scripts_info:
                print(f"[{script['index']}] Type: {script['type']}")
                if script['src']:
                    print(f"     Src: {script['src']}")
                print(f"     Size: {script['length']} bytes")
                print(f"     Has __DEFAULT_SCOPE__: {script['has_default_scope']}")
                print(f"     Has itemList: {script['has_item_list']}")
                print(f"     Has video data: {script['has_video']}")
                if script['length'] < 500:
                    print(f"     Preview: {script['preview']}")
                print()
            
            # Save detailed info
            output_path = Path('c:/Users/asplo/Documents/GitHub/Radius/backend/tiktok_data/debug/all_scripts_info.json')
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(scripts_info, f, indent=2)
            print(f"Saved to: {output_path}")
            
        finally:
            await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
