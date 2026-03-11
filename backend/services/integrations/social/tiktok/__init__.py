# TikTok Direct API Integration
# Mirrors the postforme/ provider pattern but talks directly to TikTok's Content Posting API.
#
# Structure:
#   client.py        – low-level async HTTP wrapper around open.tiktokapis.com
#   token_manager.py – reads / refreshes OAuth tokens from platform_integrations
#   social_account.py – high-level auth + posting orchestration
#   publish/         – slideshow (PHOTO carousel) and video implementations
#   analytics/       – post metrics via TikTok Video List & Query API
#   provider.py      – TikTokProvider (implements SocialProvider Protocol)
