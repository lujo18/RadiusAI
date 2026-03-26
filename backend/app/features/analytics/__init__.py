"""
Analytics feature module - Post performance tracking and metrics
"""

from app.features.analytics.service import AnalyticsService

analytics_service = AnalyticsService()

__all__ = ["analytics_service"]
