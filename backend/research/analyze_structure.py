#!/usr/bin/env python3
"""Analyze the raw TikTok data structure to find video data."""

import json
from pathlib import Path

data = json.load(open('c:\\Users\\asplo\\Documents\\GitHub\\SlideForge\\backend\\tiktok_data\\debug\\raw_data.json'))
scope = data['__DEFAULT_SCOPE__']

# Check webapp.biz-context - it has 47 items
print("=== webapp.biz-context (47 items) ===")
for key in sorted(list(scope['webapp.biz-context'].keys())[:25]):
    value = scope['webapp.biz-context'][key]
    vtype = type(value).__name__
    if isinstance(value, dict):
        print(f"  {key}: dict with {len(value)} items")
        if len(value) < 5:
            for subkey in value.keys():
                print(f"      {subkey}: {type(value[subkey]).__name__}")
    elif isinstance(value, list):
        print(f"  {key}: list with {len(value)} items")
        if value and len(value) > 0:
            print(f"      first item: {type(value[0]).__name__}")
    else:
        print(f"  {key}: {vtype} = {str(value)[:80]}")

print("\n\n=== webapp.app-context (16 items) ===")
for key in sorted(scope['webapp.app-context'].keys()):
    value = scope['webapp.app-context'][key]
    vtype = type(value).__name__
    if isinstance(value, dict):
        print(f"  {key}: dict with {len(value)} items")
    elif isinstance(value, list):
        print(f"  {key}: list with {len(value)} items")
    else:
        print(f"  {key}: {vtype}")
