"""
TikTok Scraper - 2026 Working Version
Handles TikTok's ref/node structure by extracting from script tags
"""

import asyncio
import json
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
import aiohttp
import random


async def setup_playwright():
    """Install playwright if needed"""
    try:
        from playwright.async_api import async_playwright
        return True
    except ImportError:
        print("Installing Playwright...")
        import subprocess
        subprocess.run(["pip", "install", "playwright", "--break-system-packages"])
        subprocess.run(["playwright", "install", "firefox"])
        return True


class WorkingTikTokScraper:
    """
    Works with TikTok's 2026 structure.
    The data is in script tag index 18 (application/json type).
    """
    
    def __init__(self, output_dir: str = "tiktok_data"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        (self.output_dir / "snapshots").mkdir(exist_ok=True)
        (self.output_dir / "metadata").mkdir(exist_ok=True)
        (self.output_dir / "debug").mkdir(exist_ok=True)
        
        self.browser = None
        self.context = None
        self.page = None
    
    async def __aenter__(self):
        from playwright.async_api import async_playwright
        
        self.playwright = await async_playwright().start()
        
        # Use Firefox for stealth
        self.browser = await self.playwright.firefox.launch(
            headless=False,
            slow_mo=100
        )
        
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            locale='en-US',
            timezone_id='America/New_York',
        )
        
        # Anti-detection
        await self.context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false
            });
        """)
        
        self.page = await self.context.new_page()
        
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.page:
            await self.page.close()
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
    
    async def extract_data_from_scripts(self, url: str) -> Optional[Dict]:
        """
        Extract data from script tags.
        Based on your discovery, the data is in script index 18.
        """
        print(f"\n📄 Loading: {url}")
        
        try:
            # Intercept API responses
            api_responses = {}
            
            async def handle_response(response):
                try:
                    if '/api/feed' in response.url or '/api/discover' in response.url or '/api/recommend' in response.url:
                        if response.status == 200:
                            try:
                                data = await response.json()
                                api_responses[response.url] = data
                                print(f"   ✅ Captured API: {response.url[:60]}...")
                            except:
                                pass
                except:
                    pass
            
            self.page.on('response', handle_response)
            
            await self.page.goto(url, wait_until='networkidle', timeout=30000)
            await asyncio.sleep(random.uniform(4, 6))
            
            # Take screenshot
            screenshot_path = self.output_dir / "debug" / "page.png"
            await self.page.screenshot(path=str(screenshot_path))
            print(f"   📸 Screenshot: {screenshot_path}")
            
            # Extract ALL script tags and find the one with data
            scripts_data = await self.page.evaluate("""
                () => {
                    const scripts = document.querySelectorAll('script[type="application/json"]');
                    const results = [];
                    
                    for (let i = 0; i < scripts.length; i++) {
                        const script = scripts[i];
                        const text = script.textContent;
                        
                        // Look for the script with __DEFAULT_SCOPE__
                        if (text && text.includes('__DEFAULT_SCOPE__')) {
                            try {
                                const data = JSON.parse(text);
                                results.push({
                                    index: i,
                                    found: true,
                                    data: data
                                });
                            } catch (e) {
                                results.push({
                                    index: i,
                                    found: false,
                                    error: e.toString(),
                                    preview: text.substring(0, 200)
                                });
                            }
                        }
                    }
                    
                    return results;
                }
            """)
            
            print(f"   🔍 Found {len(scripts_data)} application/json scripts")
            
            # Find the one with actual data
            for script_info in scripts_data:
                if script_info.get('found'):
                    print(f"   ✅ Found data in script index {script_info['index']}")
                    data = script_info['data']
                    
                    # Save raw data
                    raw_path = self.output_dir / "debug" / "raw_data.json"
                    with open(raw_path, 'w', encoding='utf-8') as f:
                        json.dump(data, f, indent=2)
                    print(f"   💾 Saved raw data: {raw_path}")
                    
                    return data
            
            print(f"   ⚠️  No data found in scripts")
            
            # Debug: save what we found
            debug_path = self.output_dir / "debug" / "scripts_info.json"
            with open(debug_path, 'w', encoding='utf-8') as f:
                json.dump(scripts_data, f, indent=2)
            print(f"   💾 Debug info: {debug_path}")
            
            return None
        
        except Exception as e:
            print(f"   ❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def parse_videos_from_data(self, data: Dict) -> List[Dict]:
        """
        Parse videos from the __DEFAULT_SCOPE__ structure.
        """
        print(f"\n   🔍 Parsing videos...")
        
        videos = []
        
        # The structure is: __DEFAULT_SCOPE__ -> various app modules
        # Look for modules that contain video data
        
        if '__DEFAULT_SCOPE__' not in data:
            print(f"   ⚠️  No __DEFAULT_SCOPE__ found")
            return videos
        
        scope = data['__DEFAULT_SCOPE__']
        
        # Common locations for video data
        paths_to_try = [
            ['webapp.challenge-detail', 'itemList'],
            ['webapp.video-detail', 'itemInfo', 'itemStruct'],
            ['webapp.search-page', 'itemList'],
            ['webapp.explore', 'itemList'],
            ['webapp.app-context', 'itemList'],  # Add this for your data structure
        ]
        
        # Try each path
        for path in paths_to_try:
            current = scope
            path_str = ' -> '.join(path)
            
            try:
                for key in path:
                    if key in current:
                        current = current[key]
                    else:
                        break
                else:
                    # Successfully traversed path
                    if isinstance(current, list):
                        print(f"   ✅ Found {len(current)} items at: {path_str}")
                        for item in current:
                            video = self._parse_video(item)
                            if video:
                                videos.append(video)
                        
                        if videos:
                            return videos
                    
                    elif isinstance(current, dict) and 'id' in current:
                        # Single video
                        print(f"   ✅ Found single video at: {path_str}")
                        video = self._parse_video(current)
                        if video:
                            videos.append(video)
                            return videos
            
            except Exception as e:
                continue
        
        # If nothing found in common paths, search all keys
        if not videos:
            print(f"   🔄 Searching all keys in __DEFAULT_SCOPE__...")
            
            # List all keys to help debug
            all_keys = list(scope.keys())
            print(f"   📋 Available keys: {all_keys[:10]}...")  # Show first 10
            
            # Save full structure for inspection (FIX: UTF-8 encoding)
            structure_path = self.output_dir / "debug" / "scope_structure.txt"
            with open(structure_path, 'w', encoding='utf-8') as f:
                for key in all_keys:
                    value = scope[key]
                    f.write(f"{key}: {type(value).__name__}\n")
                    if isinstance(value, dict):
                        for subkey in list(value.keys())[:5]:
                            f.write(f"  - {subkey}: {type(value[subkey]).__name__}\n")
            print(f"   💾 Structure saved: {structure_path}")
            
            # Deep search
            videos = self._deep_search_videos(scope)
            
            if videos:
                print(f"   ✅ Deep search found {len(videos)} videos")
        
        return videos
    
    def _deep_search_videos(self, data: any, depth: int = 0, max_depth: int = 5) -> List[Dict]:
        """Recursively search for video objects"""
        if depth > max_depth:
            return []
        
        videos = []
        
        if isinstance(data, dict):
            # Check if this looks like a video
            if self._looks_like_video(data):
                video = self._parse_video(data)
                if video:
                    videos.append(video)
            
            # Check for itemList
            if 'itemList' in data and isinstance(data['itemList'], list):
                for item in data['itemList']:
                    video = self._parse_video(item)
                    if video:
                        videos.append(video)
            
            # Check for ItemModule (dict of videos by ID)
            if 'ItemModule' in data and isinstance(data['ItemModule'], dict):
                for item in data['ItemModule'].values():
                    video = self._parse_video(item)
                    if video:
                        videos.append(video)
            
            # Recurse
            for value in data.values():
                videos.extend(self._deep_search_videos(value, depth + 1, max_depth))
        
        elif isinstance(data, list):
            for item in data:
                videos.extend(self._deep_search_videos(item, depth + 1, max_depth))
        
        return videos
    
    def _looks_like_video(self, obj: Dict) -> bool:
        """Check if dict looks like a video"""
        if not isinstance(obj, dict):
            return False
        
        # Must have id and either stats or author
        has_id = 'id' in obj
        has_stats = 'stats' in obj
        has_author = 'author' in obj
        has_video = 'video' in obj
        
        return has_id and (has_stats or has_author or has_video)
    
    def _parse_video(self, item: Dict) -> Optional[Dict]:
        """Parse a video item"""
        try:
            if not isinstance(item, dict) or 'id' not in item:
                return None
            
            video_id = str(item.get('id', ''))
            desc = item.get('desc', '')
            
            # Author
            author = item.get('author', {})
            author_id = author.get('uniqueId', '') if isinstance(author, dict) else ''
            author_name = author.get('nickname', '') if isinstance(author, dict) else ''
            
            # Stats
            stats = item.get('stats', {})
            
            # Check if slideshow
            is_slideshow = 'imagePost' in item
            slideshow_images = []
            
            if is_slideshow:
                img_list = item.get('imagePost', {}).get('images', [])
                for img in img_list:
                    if isinstance(img, dict):
                        url_list = img.get('imageURL', {}).get('urlList', [])
                        if url_list:
                            slideshow_images.append(url_list[0])
            
            # Video thumbnail
            video_obj = item.get('video', {})
            thumbnail_url = ''
            
            if isinstance(video_obj, dict):
                thumbnail_url = (
                    video_obj.get('cover', '') or
                    video_obj.get('dynamicCover', '') or
                    video_obj.get('originCover', '')
                )
            
            # Hashtags
            hashtags = []
            if 'challenges' in item:
                for ch in item.get('challenges', []):
                    if isinstance(ch, dict) and 'title' in ch:
                        hashtags.append(ch['title'])
            
            return {
                'id': video_id,
                'desc': desc,
                'author': author_id,
                'author_nickname': author_name,
                'create_time': item.get('createTime', 0),
                'is_slideshow': is_slideshow,
                'slideshow_images': slideshow_images,
                'thumbnail_url': thumbnail_url,
                'stats': {
                    'plays': stats.get('playCount', 0) if isinstance(stats, dict) else 0,
                    'likes': stats.get('diggCount', 0) if isinstance(stats, dict) else 0,
                    'comments': stats.get('commentCount', 0) if isinstance(stats, dict) else 0,
                    'shares': stats.get('shareCount', 0) if isinstance(stats, dict) else 0,
                },
                'hashtags': list(set(hashtags)),
                'music': item.get('music', {}).get('title', '') if isinstance(item.get('music'), dict) else '',
                'url': f"https://www.tiktok.com/@{author_id}/video/{video_id}" if author_id else '',
                'collected_at': datetime.now().isoformat()
            }
        
        except Exception as e:
            print(f"      ⚠️  Parse error: {e}")
            return None
    
    def calculate_engagement_score(self, video: Dict) -> float:
        """Calculate engagement score"""
        stats = video['stats']
        plays = stats['plays']
        
        if plays == 0:
            return 0.0
        
        score = (
            (stats['likes'] / plays) * 1.0 +
            (stats['comments'] / plays) * 2.0 +
            (stats['shares'] / plays) * 3.0
        ) * 100
        
        return round(score, 2)
    
    async def download_snapshot(self, url: str, filepath: Path) -> bool:
        """Download image/thumbnail"""
        if not url:
            return False
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=30) as response:
                    if response.status == 200:
                        content = await response.read()
                        with open(filepath, 'wb') as f:
                            f.write(content)
                        return True
        except Exception as e:
            print(f"      ⚠️  Download error: {e}")
        return False
    
    async def download_snapshots(self, videos: List[Dict], max_downloads: int = 20):
        """Download snapshots for videos"""
        print(f"\n   📥 Downloading snapshots (top {max_downloads})...")
        
        # Sort by engagement
        for video in videos:
            video['engagement_score'] = self.calculate_engagement_score(video)
        
        videos.sort(key=lambda x: x['engagement_score'], reverse=True)
        
        downloaded_count = 0
        
        for i, video in enumerate(videos[:max_downloads], 1):
            video_id = video['id']
            
            # Slideshow
            if video['is_slideshow'] and video['slideshow_images']:
                print(f"      [{i}] Slideshow {video_id} ({len(video['slideshow_images'])} images)")
                downloaded = []
                
                for idx, img_url in enumerate(video['slideshow_images'][:5]):
                    filepath = self.output_dir / "snapshots" / f"{video_id}_{idx}.jpg"
                    if await self.download_snapshot(img_url, filepath):
                        downloaded.append(str(filepath))
                        downloaded_count += 1
                
                video['downloaded_files'] = downloaded
            
            # Regular video thumbnail
            elif video['thumbnail_url']:
                print(f"      [{i}] Video {video_id}")
                filepath = self.output_dir / "snapshots" / f"{video_id}_thumb.jpg"
                
                if await self.download_snapshot(video['thumbnail_url'], filepath):
                    video['downloaded_files'] = [str(filepath)]
                    downloaded_count += 1
            
            await asyncio.sleep(random.uniform(0.5, 1.0))
        
        print(f"   ✅ Downloaded {downloaded_count} files")
    
    def save_metadata(self, videos: List[Dict], filename: str = "videos.json"):
        """Save metadata"""
        if not videos:
            return
        
        for video in videos:
            video['engagement_score'] = self.calculate_engagement_score(video)
        
        videos.sort(key=lambda x: x['engagement_score'], reverse=True)
        
        filepath = self.output_dir / "metadata" / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(videos, f, indent=2, ensure_ascii=False)
        
        print(f"\n   💾 Saved {len(videos)} videos: {filepath}")
    
    def generate_report(self, videos: List[Dict]):
        """Generate report"""
        if not videos:
            return
        
        slideshows = [v for v in videos if v['is_slideshow']]
        regular = [v for v in videos if not v['is_slideshow']]
        
        total_likes = sum(v['stats']['likes'] for v in videos)
        avg_likes = total_likes / len(videos) if videos else 0
        
        top = max(videos, key=lambda x: x['stats']['likes'])
        
        print("\n" + "="*60)
        print("SCRAPING RESULTS")
        print("="*60)
        print(f"\n📊 Collected:")
        print(f"   Total videos: {len(videos)}")
        print(f"   Slideshows: {len(slideshows)}")
        print(f"   Regular videos: {len(regular)}")
        print(f"   Avg likes: {avg_likes:,.0f}")
        
        print(f"\n🏆 Top video:")
        print(f"   @{top['author']} - {top['desc'][:50]}...")
        print(f"   {top['stats']['likes']:,} likes")
        print(f"   Engagement: {self.calculate_engagement_score(top):.2f}")
        
        print("="*60)
    
    async def scrape_hashtag(self, hashtag: str, max_videos: int = 50):
        """Main scraping workflow"""
        print(f"\n{'='*60}")
        print(f"🎯 Scraping #{hashtag}")
        print(f"{'='*60}")
        
        url = f"https://www.tiktok.com/tag/{hashtag}"
        
        # Extract data
        data = await self.extract_data_from_scripts(url)
        
        if not data:
            print("\n❌ No data extracted")
            print("\n💡 Check debug/ folder:")
            print("   • page.png - Screenshot of page")
            print("   • scripts_info.json - What scripts were found")
            return []
        
        # Parse videos
        videos = self.parse_videos_from_data(data)
        
        if not videos:
            print("\n⚠️  No videos parsed")
            print("\n💡 The data structure may have changed.")
            print("   Check debug/scope_structure.txt to see available keys")
            print("   Send me this file and I'll update the parser!")
            return []
        
        print(f"\n✅ Parsed {len(videos)} videos")
        
        # Download snapshots
        await self.download_snapshots(videos, max_downloads=min(20, len(videos)))
        
        # Save metadata
        self.save_metadata(videos, f"{hashtag}_videos.json")
        
        # Report
        self.generate_report(videos)
        
        return videos


async def main():
    """Main entry point"""
    
    print("="*60)
    print("TikTok Scraper - 2026 Working Version")
    print("="*60)
    print("\nExtracts from script tags (handles ref/node structure)")
    print("Gets ALL videos + downloads snapshots")
    print()
    
    await setup_playwright()
    
    hashtag = input("Hashtag (without #): ").strip() or "gym"
    
    async with WorkingTikTokScraper() as scraper:
        videos = await scraper.scrape_hashtag(hashtag, max_videos=50)
        
        if videos:
            print(f"\n✅ Success! Collected {len(videos)} videos")
            print(f"\n📁 Check folders:")
            print(f"   • snapshots/ - Downloaded images")
            print(f"   • metadata/{hashtag}_videos.json - Video data")
        else:
            print(f"\n❌ No videos collected")
            print(f"\n📋 If data was extracted but not parsed:")
            print(f"   1. Check debug/scope_structure.txt")
            print(f"   2. Send me that file")
            print(f"   3. I'll update the parser for the current structure!")


if __name__ == "__main__":
    asyncio.run(main())