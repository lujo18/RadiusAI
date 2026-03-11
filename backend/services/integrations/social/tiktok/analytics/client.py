"""
TikTok Analytics Client.

Reads post metrics directly from TikTok's Video List & Query APIs.
This replaces PostForMe as the analytics source for TikTok posts.

Key endpoints:
  GET  /v2/video/list/   → paginated list of videos for the authed account
  POST /v2/video/query/  → fetch metrics for specific video IDs (up to 20 per call)

Usage:
    from services.integrations.social.tiktok.analytics.client import TikTokAnalyticsClient

    analytics_client = TikTokAnalyticsClient()
    result = await analytics_client.get_post_analytics(
        external_post_id="7609906972204322061",
        integration_id="<platform_integrations.id>",
    )
"""

import logging
from typing import List, Optional

from backend.services.integrations.supabase.db.post import get_post
from services.integrations.supabase.db.platformIntegration import getIntegrationById
from ..client import TikTokClient, TikTokAPIError
from ..token_manager import get_valid_token, make_refresh_fn, TokenError
from .models import TikTokPostAnalytics, TikTokVideoItem, TikTokVideoListResponse

logger = logging.getLogger(__name__)

# Fields requested from TikTok's video endpoints
# Ref: https://developers.tiktok.com/doc/video-api-list#fields
_VIDEO_FIELDS = ",".join(
    [
        "id",
        "title",
        "video_description",
        "create_time",
        "cover_image_url",
        "share_url",
        "embed_link",
        "duration",
        "like_count",
        "comment_count",
        "share_count",
        "view_count",
        "play_count",
        "average_time_watched",
        "total_time_watched",
        "full_video_watched_rate",
        "reach",
        "forward_count",
        "backward_count",
    ]
)


class TikTokAnalyticsClient:
    """Fetches TikTok post analytics via the official Content Posting / Video API."""

    # ------------------------------------------------------------------
    # Public interface (mirrors PostForMeAnalyticsClient.get_post_analytics)
    # ------------------------------------------------------------------
    


    async def get_post_analytics(
        self,
        external_post_id: str,
        integration_id: str,
    ) -> Optional[TikTokPostAnalytics]:
        """
        Fetch analytics for a single TikTok post.

        Args:
            external_post_id: TikTok's native video/post ID stored in posts.external_post_id.
            integration_id:   platform_integrations.id for the TikTok account.

        Returns:
            TikTokPostAnalytics with the latest metrics, or None on error.
        """
        try:
            token = await get_valid_token(integration_id)
        except TokenError as exc:
            logger.error(f"[TikTok analytics] Token error for {integration_id}: {exc}")
            return None

        client = TikTokClient(token, refresh_fn=make_refresh_fn(integration_id))

        try:
            video = await self._query_single_video(client, external_post_id)
        except TikTokAPIError as exc:
            logger.error(
                f"[TikTok analytics] API error fetching video {external_post_id}: {exc}"
            )
            return None
        except Exception as exc:
            logger.error(
                f"[TikTok analytics] Unexpected error for video {external_post_id}: {exc}"
            )
            return None

        if video is None:
            logger.warning(
                f"[TikTok analytics] Video {external_post_id} not found in account {integration_id}"
            )
            return None

        return self._to_analytics(video)

    # ------------------------------------------------------------------
    # Bulk fetch
    # ------------------------------------------------------------------

    async def get_multiple_posts_analytics(
        self,
        external_post_ids: List[str],
        integration_id: str,
    ) -> List[TikTokPostAnalytics]:
        """
        Fetch analytics for multiple TikTok posts in a single API round-trip.
        TikTok allows up to 20 video IDs per /v2/video/query/ call.

        Returns a list (may be shorter than input if some videos were not found).
        """
        if not external_post_ids:
            return []

        try:
            token = await get_valid_token(integration_id)
        except TokenError as exc:
            logger.error(f"[TikTok analytics] Token error for {integration_id}: {exc}")
            return []

        client = TikTokClient(token, refresh_fn=make_refresh_fn(integration_id))
        results: List[TikTokPostAnalytics] = []

        # Batch in chunks of 20 (TikTok API limit)
        for i in range(0, len(external_post_ids), 20):
            batch = external_post_ids[i : i + 20]
            try:
                videos = await self._query_videos_batch(client, batch)
                results.extend(self._to_analytics(v) for v in videos)
            except Exception as exc:
                logger.error(f"[TikTok analytics] Batch query failed (chunk {i}): {exc}")

        return results

    # ------------------------------------------------------------------
    # Account-level video list
    # ------------------------------------------------------------------

    async def list_account_videos(
        self,
        integration_id: str,
        max_count: int = 20,
        cursor: Optional[int] = None,
    ) -> TikTokVideoListResponse:
        """
        Fetch a paginated list of videos for the connected TikTok account.

        Args:
            integration_id: platform_integrations.id
            max_count:       Number of videos per page (1–20, default 20).
            cursor:          Pagination cursor from a previous response.

        Returns:
            TikTokVideoListResponse with video items and pagination info.
        """
        token = await get_valid_token(integration_id)
        client = TikTokClient(token, refresh_fn=make_refresh_fn(integration_id))

        params: dict = {"max_count": min(max_count, 20)}
        if cursor is not None:
            params["cursor"] = cursor

        raw = await client.get("/video/list/", params=params, fields=_VIDEO_FIELDS)
        return TikTokVideoListResponse(**raw)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _query_single_video(
        self, client: TikTokClient, video_id: str
    ) -> Optional[TikTokVideoItem]:
        """Fetch a single video item via the query endpoint."""
        videos = await self._query_videos_batch(client, [video_id])
        return videos[0] if videos else None

    async def _query_videos_batch(
        self, client: TikTokClient, video_ids: List[str]
    ) -> List[TikTokVideoItem]:
        """
        POST /v2/video/query/ with a list of video IDs.
        Returns a list of TikTokVideoItem objects.
        """
        payload = {
            "filters": {"video_ids": video_ids},
            "fields": _VIDEO_FIELDS,
        }
        raw = await client.post("/video/query/", payload)
        raw_videos: list = raw.get("data", {}).get("videos", [])
        return [TikTokVideoItem(**v) for v in raw_videos]

    @staticmethod
    def _to_analytics(video: TikTokVideoItem) -> TikTokPostAnalytics:
        """Convert a TikTokVideoItem to the normalised TikTokPostAnalytics shape."""
        return TikTokPostAnalytics(
            platform_post_id=video.id,
            platform="tiktok",
            posted_at=video.created_at,
            share_url=video.share_url,
            like_count=video.like_count or 0,
            comment_count=video.comment_count or 0,
            share_count=video.share_count or 0,
            view_count=video.view_count or 0,
            play_count=video.play_count or 0,
            average_time_watched=getattr(video, "average_time_watched", 0.0) or 0.0,
            total_time_watched=getattr(video, "total_time_watched", 0.0) or 0.0,
            full_video_watched_rate=getattr(video, "full_video_watched_rate", 0.0) or 0.0,
            reach=getattr(video, "reach", 0) or 0,
        )
