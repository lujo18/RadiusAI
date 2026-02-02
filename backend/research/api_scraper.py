#!/usr/bin/env python3
"""
TikTok Scraper - Production Ready
Uses direct API calls to fetch video data and metadata.
"""

import asyncio
import json
import os
import aiohttp
import random
from pathlib import Path
from datetime import datetime

class TikTokAPIScraper:
    """Scrape TikTok using direct API calls."""
    
    BASE_URL = "https://www.tiktok.com/api/v1/feed"
    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.tiktok.com/',
    }
    
    def __init__(self, output_dir="tiktok_data"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        (self.output_dir / "videos").mkdir(exist_ok=True)
        (self.output_dir / "snapshots").mkdir(exist_ok=True)
        self.videos = []
    
    async def scrape_hashtag(self, hashtag: str, max_videos: int = 100):
        """
        Scrape hashtag by fetching from TikTok's discover API.
        """
        print(f"\n{'='*60}")
        print(f"🎯 Scraping #{hashtag}")
        print(f"{'='*60}\n")
        
        try:
            async with aiohttp.ClientSession() as session:
                # Fetch discover page which has hashtag videos
                url = f"https://www.tiktok.com/api/explore/get_feed/?count=30&offset=0&type=tag&tag={hashtag}"
                
                print(f"📄 Fetching: {url[:60]}...")
                
                async with session.get(url, headers=self.HEADERS, timeout=30) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        print(f"   ✅ Got response")
                        self._parse_feed(data)
                    else:
                        print(f"   ❌ Status: {resp.status}")
            
            # Save results
            self._save_videos()
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
    
    def _parse_feed(self, data: dict):
        """Parse feed response to extract videos."""
        if 'itemList' in data:
            items = data['itemList']
            print(f"   🎬 Found {len(items)} videos")
            
            for item in items:
                if isinstance(item, dict):
                    # Extract video info
                    video = {
                        'id': item.get('id', ''),
                        'desc': item.get('desc', ''),
                        'author': item.get('author', {}).get('nickname', ''),
                        'stats': item.get('stats', {}),
                        'video': item.get('video', {}).get('downloadAddr', ''),
                    }
                    
                    if video['id']:
                        self.videos.append(video)
            
            print(f"   ✅ Extracted {len(self.videos)} videos")
    
    def _save_videos(self):
        """Save videos to JSON and CSV."""
        if not self.videos:
            print("⚠️  No videos to save")
            return
        
        # Save JSON
        json_path = self.output_dir / "videos.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(self.videos, f, indent=2, ensure_ascii=False)
        
        # Save CSV
        csv_path = self.output_dir / "videos.csv"
        with open(csv_path, 'w', encoding='utf-8') as f:
            f.write("id,title,author,views,likes,shares\n")
            for v in self.videos:
                stats = v.get('stats', {})
                f.write(f"{v['id']},\"{v.get('desc', '')}\",{v.get('author', '')},{stats.get('playCount', 0)},{stats.get('likeCount', 0)},{stats.get('shareCount', 0)}\n")
        
        print(f"   💾 Saved: {json_path}")
        print(f"   💾 Saved: {csv_path}")


async def main():
    scraper = TikTokAPIScraper()
    await scraper.scrape_hashtag("gym", max_videos=100)


if __name__ == '__main__':
    asyncio.run(main())
