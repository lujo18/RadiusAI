#!/usr/bin/env python3
"""Test TikTok API response structure."""

import asyncio
import aiohttp
import json

async def test_api():
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.tiktok.com/',
    }
    
    urls = [
        "https://www.tiktok.com/api/explore/get_feed/?count=30&offset=0&type=tag&tag=gym",
        "https://www.tiktok.com/api/recommend/feed/?count=30&offset=0",
        "https://api.tiktok.com/v1/feed",
    ]
    
    async with aiohttp.ClientSession() as session:
        for url in urls:
            print(f"\nTesting: {url[:60]}...")
            try:
                async with session.get(url, headers=headers, timeout=10) as resp:
                    print(f"  Status: {resp.status}")
                    data = await resp.json()
                    
                    # Save response
                    with open(f'c:\\Users\\asplo\\Documents\\GitHub\\Radius\\backend\\tiktok_data\\debug\\api_response_{urls.index(url)}.json', 'w') as f:
                        json.dump(data, f, indent=2)
                    
                    # Show structure
                    print(f"  Keys: {list(data.keys())[:10]}")
                    
                    if 'itemList' in data:
                        print(f"  Items: {len(data['itemList'])}")
            except Exception as e:
                print(f"  Error: {e}")

asyncio.run(test_api())
