#!/usr/bin/env python3
"""
TikTok Scraper - Final Working Version
Gets video IDs from hashtag page, then scrapes each video's detail page.
"""

import asyncio
import json
import re
from pathlib import Path
from datetime import datetime
import random

from playwright.async_api import async_playwright


class TikTokDetailScraper:
    """Scrape individual TikTok videos for detailed data."""
    
    def __init__(self, output_dir="tiktok_data"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        (self.output_dir / "debug").mkdir(exist_ok=True)
        (self.output_dir / "videos").mkdir(exist_ok=True)
        (self.output_dir / "snapshots").mkdir(exist_ok=True)
        
        self.videos = []
    
    async def scrape_hashtag(self, hashtag: str, max_videos: int = 100):
        """Scrape hashtag by getting video IDs then fetching details."""
        print(f"\n{'='*60}")
        print(f"🎯 Scraping #{hashtag}")
        print(f"{'='*60}\n")
        
        async with async_playwright() as p:
            # Get video IDs from hashtag page
            browser = await p.firefox.launch(headless=False)
            page = await browser.new_page(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0'
            )
            
            # Stealth
            await page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
            """)
            
            video_ids = await self._get_video_ids(page, hashtag)
            await browser.close()
            
            print(f"🎬 Found {len(video_ids)} video IDs")
            
            # Now scrape each video's details
            for i, vid_id in enumerate(video_ids[:max_videos]):
                print(f"\n[{i+1}/{min(len(video_ids), max_videos)}] Fetching video {vid_id}...")
                
                browser = await p.firefox.launch(headless=False)
                page = await browser.new_page(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0'
                )
                
                await page.add_init_script("""
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined,
                    });
                """)
                
                video_data = await self._scrape_video(page, vid_id)
                if video_data:
                    self.videos.append(video_data)
                    print(f"   ✅ Got: {video_data['title'][:50]}")
                
                await browser.close()
                
                # Rate limit
                await asyncio.sleep(random.uniform(2, 4))
            
            # Save
            self._save_videos()
    
    async def _get_video_ids(self, page, hashtag: str) -> list:
        """Extract video IDs from hashtag page."""
        url = f"https://www.tiktok.com/tag/{hashtag}"
        print(f"📄 Loading: {url}")
        
        await page.goto(url, wait_until='networkidle', timeout=30000)
        await asyncio.sleep(2)
        
        # Extract IDs from script tags
        ids = await page.evaluate("""
            () => {
                const scripts = document.querySelectorAll('script[type="application/json"]');
                const ids = [];
                
                for (let script of scripts) {
                    try {
                        const data = JSON.parse(script.textContent);
                        if (data.__DEFAULT_SCOPE__ && data.__DEFAULT_SCOPE__['seo.abtest']) {
                            const vidList = data.__DEFAULT_SCOPE__['seo.abtest'].vidList;
                            if (Array.isArray(vidList)) {
                                ids.push(...vidList);
                            }
                        }
                    } catch (e) {
                        // Skip
                    }
                }
                
                return ids;
            }
        """)
        
        return ids
    
    async def _scrape_video(self, page, video_id: str) -> dict:
        """Scrape details for a single video."""
        url = f"https://www.tiktok.com/@user/video/{video_id}"
        
        try:
            await page.goto(url, wait_until='networkidle', timeout=30000)
            await asyncio.sleep(2)
            
            # Extract data from page
            data = await page.evaluate("""
                () => {
                    // Get video info from page
                    const scripts = document.querySelectorAll('script[type="application/json"]');
                    let videoData = null;
                    
                    for (let script of scripts) {
                        try {
                            const data = JSON.parse(script.textContent);
                            if (data.__DEFAULT_SCOPE__) {
                                // Look for video details in the scope
                                const scope = data.__DEFAULT_SCOPE__;
                                
                                // Check all keys for video data
                                for (let key in scope) {
                                    if (scope[key] && typeof scope[key] === 'object') {
                                        // Look for id matching our video
                                        const str = JSON.stringify(scope[key]);
                                        if (str.includes('video')) {
                                            videoData = scope[key];
                                            break;
                                        }
                                    }
                                }
                                if (videoData) break;
                            }
                        } catch (e) {
                            // Skip
                        }
                    }
                    
                    return videoData || { data: 'not found' };
                }
            """)
            
            # Try alternative: get from DOM
            title = await page.locator('h1').first.inner_text().catch(() => '')
            
            # Take screenshot
            snapshot_path = self.output_dir / "snapshots" / f"{video_id}.png"
            await page.screenshot(path=str(snapshot_path))
            
            return {
                'id': video_id,
                'title': title,
                'url': url,
                'snapshot': str(snapshot_path),
                'scraped_at': datetime.now().isoformat(),
            }
        
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return None
    
    def _save_videos(self):
        """Save collected videos."""
        if not self.videos:
            print("⚠️  No videos to save")
            return
        
        # Save JSON
        json_path = self.output_dir / "videos.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(self.videos, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Saved {len(self.videos)} videos")
        print(f"   💾 {json_path}")


async def main():
    scraper = TikTokDetailScraper()
    await scraper.scrape_hashtag("gym", max_videos=10)


if __name__ == '__main__':
    asyncio.run(main())
