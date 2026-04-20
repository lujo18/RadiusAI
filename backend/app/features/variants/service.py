"""
Variants Service - Business logic for A/B testing and variant management.
"""

import logging
from datetime import datetime, timedelta
from uuid import uuid4

from app.core.database import get_db_session
from app.core.exceptions import ExternalServiceError, NotFoundError, ValidationError
from app.features.variants.models import VariantPerfornance, VariantSet
from app.features.variants.repository import VariantPerformanceRepository, VariantSetRepository

logger = logging.getLogger(__name__)


class VariantsService:
    """Service for A/B testing with template variants."""

    def __init__(
        self,
        variant_set_repository: VariantSetRepository | None = None,
        variant_performance_repository: VariantPerformanceRepository | None = None,
    ):
        self.variant_set_repository = variant_set_repository or VariantSetRepository()
        self.variant_performance_repository = (
            variant_performance_repository or VariantPerformanceRepository()
        )

    async def _get_variant_set_or_raise(self, db, variant_set_id: str) -> VariantSet:
        variant_set = await self.variant_set_repository.get_by_id(db, variant_set_id)
        if not variant_set:
            raise NotFoundError("VariantSet", variant_set_id)
        return variant_set

    async def create_variant_set(
        self,
        team_id: str,
        user_id: str,
        name: str,
        templates: list[str],
        posts_per_template: int = 5,
        duration_days: int = 7,
        description: str | None = None,
    ) -> VariantSet:
        """Create new A/B test variant set."""
        try:
            if len(templates) < 2:
                raise ValidationError("Must test at least 2 templates")
            if len(templates) > 10:
                raise ValidationError("Cannot test more than 10 templates")
            if posts_per_template < 1 or posts_per_template > 50:
                raise ValidationError("posts_per_template must be 1-50")
            if duration_days < 1 or duration_days > 90:
                raise ValidationError("duration_days must be 1-90")

            variant_set = VariantSet(
                id=f"variant_{uuid4().hex[:12]}",
                team_id=team_id,
                user_id=user_id,
                name=name,
                description=description,
                templates=templates,
                posts_per_template=posts_per_template,
                total_duration_days=duration_days,
                status="active",
                end_date=datetime.utcnow() + timedelta(days=duration_days),
            )

            async with get_db_session() as db:
                created = await self.variant_set_repository.create(db, variant_set)
                logger.info(f"Variant set created: {created.id} with {len(templates)} templates")
                return created
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to create variant set: {e}", exc_info=True)
            raise ExternalServiceError("variants", f"Failed to create variant set: {e}")

    async def get_variant_set(self, variant_set_id: str) -> VariantSet:
        """Get variant set by ID."""
        try:
            async with get_db_session() as db:
                return await self._get_variant_set_or_raise(db, variant_set_id)
        except NotFoundError:
            raise
        except Exception as e:
            logger.error(f"Failed to fetch variant set: {e}")
            raise ExternalServiceError("variants", "Failed to fetch variant set")

    async def complete_variant_set(self, variant_set_id: str) -> VariantSet:
        """Mark variant set as completed and calculate final results."""
        try:
            async with get_db_session() as db:
                variant_set = await self._get_variant_set_or_raise(db, variant_set_id)

                performances = await self.variant_performance_repository.get_by_variant_set(
                    db, variant_set_id
                )
                if not performances:
                    raise ValidationError("No performance data for variant set")

                winner = max(performances, key=lambda p: p.overall_score)
                winner.is_winning = True
                await self.variant_performance_repository.update(db, winner)

                stats = {
                    p.template_id: {
                        "avg_impressions": p.avg_impressions,
                        "avg_engagement": p.avg_engagement,
                        "engagement_rate": p.avg_engagement_rate,
                        "total_posts": p.total_posts,
                    }
                    for p in performances
                }

                variant_set.status = "completed"
                variant_set.completed_at = datetime.utcnow()
                variant_set.results = {
                    "winning_template_id": winner.template_id,
                    "confidence_score": winner.confidence_score,
                    "stats": stats,
                    "insights": self._generate_insights(performances, winner),
                }
                variant_set = await self.variant_set_repository.update(db, variant_set)

                logger.info(
                    f"Variant set completed: {variant_set_id}, winner: {winner.template_id}"
                )
                return variant_set
        except (NotFoundError, ValidationError):
            raise
        except Exception as e:
            logger.error(f"Failed to complete variant set: {e}", exc_info=True)
            raise ExternalServiceError("variants", "Failed to complete variant set")

    async def pause_variant_set(self, variant_set_id: str) -> VariantSet:
        """Pause an active variant set."""
        try:
            async with get_db_session() as db:
                variant_set = await self._get_variant_set_or_raise(db, variant_set_id)
                if variant_set.status != "active":
                    raise ValidationError("Can only pause active variant sets")

                variant_set.status = "paused"
                variant_set = await self.variant_set_repository.update(db, variant_set)
                logger.info(f"Variant set paused: {variant_set_id}")
                return variant_set
        except (NotFoundError, ValidationError):
            raise
        except Exception as e:
            logger.error(f"Failed to pause variant set: {e}")
            raise ExternalServiceError("variants", "Failed to pause variant set")

    def _generate_insights(
        self, performances: list[VariantPerfornance], winner: VariantPerfornance
    ) -> list[str]:
        """Generate insights from variant performance data."""
        insights: list[str] = []
        positive_scores = [p.overall_score for p in performances if p.overall_score > 0]
        if positive_scores:
            baseline = min(positive_scores)
            margin = ((winner.overall_score - baseline) / baseline) * 100 if baseline > 0 else 0
            insights.append(f"Winner outperforms by {margin:.1f}%")

        if winner.avg_engagement_rate > 5.0:
            insights.append(
                "High engagement template - consider replicating structure for other campaigns"
            )

        if winner.confidence_score > 0.95:
            insights.append(
                "Strong confidence in results - template is statistically significant winner"
            )
        elif winner.confidence_score < 0.7:
            insights.append("Low confidence - consider running test longer for more data")

        return insights



def get_variants_service() -> VariantsService:
    """Create request-scoped variants service."""
    return VariantsService()


__all__ = ["VariantsService", "get_variants_service"]
