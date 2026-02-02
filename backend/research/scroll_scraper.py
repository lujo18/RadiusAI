#!/usr/bin/env python3
"""
TikTok Hashtag Scraper - Version 2
Extracts videos by simulating scroll and capturing API responses
"""

import asyncio
import json
import os
from pathlib import Path
from datetime import datetime
import random

from playwright.async_api import async_playwright


class TikTokScrollScraper:
    """Scrape TikTok hashtag by scrolling and capturing API responses."""
    
    def __init__(self, output_dir="tiktok_data"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        (self.output_dir / "debug").mkdir(exist_ok=True)
        (self.output_dir / "videos").mkdir(exist_ok=True)
        (self.output_dir / "snapshots").mkdir(exist_ok=True)
        
        self.videos = {}  # video_id -> video_data
        self.page = None
        self.browser = None
        self.playwright = None
        
    async def setup(self):
        """Initialize Playwright."""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.firefox.launch(headless=False)
        self.page = await self.browser.new_page(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0'
        )
        
        # Add stealth script
        await self.page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        """)
    
    async def cleanup(self):
        """Close Playwright."""
        if self.page:
            await self.page.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
    
    async def scrape_hashtag(self, hashtag: str, max_videos: int = 100):
        """
        Scrape a TikTok hashtag by scrolling.
        
        Args:
            hashtag: Hashtag to scrape (without #)
            max_videos: Maximum videos to collect
        """
        print(f"\n{'='*60}")
        print(f"🎯 Scraping #{hashtag}")
        print(f"{'='*60}\n")
        
        url = f"https://www.tiktok.com/tag/{hashtag}"
        
        try:
            await self.setup()
            
            # Intercept API calls
            captured_videos = []
            
            async def on_response(response):
                try:
                    if 'feed' in response.url or 'recommend' in response.url or 'api' in response.url:
                        if response.status == 200 and response.content_type and 'json' in response.content_type:
                            data = await response.json()
                            self._extract_videos_from_response(data)
                except Exception:
                    pass
            
            self.page.on('response', on_response)
            
            # Load page
            print(f"📄 Loading: {url}")
            await self.page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await asyncio.sleep(random.uniform(2, 4))
            
            # Get initial video IDs from HTML
            print(f"🔍 Extracting initial video data...")
            initial_videos = await self._get_videos_from_html()
            print(f"   ✅ Found {len(initial_videos)} video IDs in HTML")
            
            # Scroll to load more
            scroll_count = 0
            last_video_count = 0
            
            while len(self.videos) < max_videos and scroll_count < 10:
                print(f"\n📜 Scrolling... ({scroll_count + 1}/10)")
                
                # Scroll down
                await self.page.evaluate("window.scrollBy(0, window.innerHeight)")
                await asyncio.sleep(random.uniform(2, 4))
                
                # Check how many videos we have
                current_count = len(self.videos)
                if current_count > last_video_count:
                    print(f"   ✅ Now have {current_count} videos")
                    last_video_count = current_count
                else:
                    print(f"   ⚠️  No new videos (still {current_count})")
                
                scroll_count += 1
            
            # Save results
            if self.videos:
                self._save_videos()
                print(f"\n✅ Collected {len(self.videos)} videos")
            else:
                print(f"\n⚠️  No videos collected")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            await self.cleanup()
    
    async def _get_videos_from_html(self) -> list:
        """Extract video IDs from the initial HTML."""
        videos = await self.page.evaluate("""
            () => {
                const scripts = document.querySelectorAll('script[type="application/json"]');
                const videoIds = [];
                
                for (let script of scripts) {
                    try {
                        const data = JSON.parse(script.textContent);
                        if (data.__DEFAULT_SCOPE__ && data.__DEFAULT_SCOPE__['seo.abtest']) {
                            const vidList = data.__DEFAULT_SCOPE__['seo.abtest'].vidList;
                            if (Array.isArray(vidList)) {
                                videoIds.push(...vidList);
                            }
                        }
                    } catch (e) {
                        // Skip parse errors
                    }
                }
                
                return videoIds;
            }
        """)
        
        for vid_id in videos:
            if vid_id not in self.videos:
                self.videos[vid_id] = {'id': vid_id}
        
        return videos
    
    def _extract_videos_from_response(self, data: dict):
        """Extract video data from API responses."""
        # Look for itemList or video data
        self._search_for_videos(data)
    
    def _search_for_videos(self, obj, depth=0, max_depth=10):
        """Recursively search for video data in API responses."""
        if depth > max_depth:
            return
        
        if isinstance(obj, dict):
            # Check if this is a video object
            if 'id' in obj and ('author' in obj or 'desc' in obj or 'stats' in obj or 'createTime' in obj):
                vid_id = str(obj.get('id', ''))
                if vid_id and len(vid_id) > 5:
                    if vid_id not in self.videos:
                        self.videos[vid_id] = {
                            'id': vid_id,
                            'title': obj.get('desc', ''),
                            'author': obj.get('author', {}).get('nickname', '') if isinstance(obj.get('author'), dict) else '',
                            'stats': obj.get('stats', {}),
                            'createTime': obj.get('createTime', 0),
                        }
            
            # Recurse into dict values
            for value in obj.values():
                self._search_for_videos(value, depth + 1, max_depth)
        
        elif isinstance(obj, list):
            for item in obj:
                self._search_for_videos(item, depth + 1, max_depth)
    
    def _save_videos(self):
        """Save collected videos to disk."""
        # Save JSON
        json_path = self.output_dir / "videos.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(list(self.videos.values()), f, indent=2, ensure_ascii=False)
        
        # Save CSV
        csv_path = self.output_dir / "videos.csv"
        with open(csv_path, 'w', encoding='utf-8') as f:
            f.write("id,title,author,views,likes,comments,shares,createTime\n")
            for video in self.videos.values():
                stats = video.get('stats', {})
                f.write(f"{video['id']},\"{video.get('title', '')}\",{video.get('author', '')},{stats.get('playCount', 0)},{stats.get('likeCount', 0)},{stats.get('commentCount', 0)},{stats.get('shareCount', 0)},{video.get('createTime', 0)}\n")
        
        print(f"   💾 Saved: {json_path}")
        print(f"   💾 Saved: {csv_path}")


async def main():
    scraper = TikTokScrollScraper()
    await scraper.scrape_hashtag("gym", max_videos=100)


if __name__ == '__main__':
    asyncio.run(main())
