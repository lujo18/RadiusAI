"""
Variants Service - Business logic for A/B testing and variant management
"""

import logging
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from uuid import uuid4

from app.core.exceptions import NotFoundError, ValidationError, ExternalServiceError
from app.features.variants.repository import variant_set_repo, variant_perf_repo
from app.features.variants.models import VariantSet, VariantPerfornance

logger = logging.getLogger(__name__)


class VariantsService:
    """Service for A/B testing with template variants."""

    async def create_variant_set(
        self,
        db: AsyncSession,
        team_id: str,
        user_id: str,
        name: str,
        templates: list[str],
        posts_per_template: int = 5,
        duration_days: int = 7,
        description: str = None,
    ) -> VariantSet:
        """
        Create new A/B test variant set.

        Args:
            db: Database session
            team_id: Team running test
            user_id: User creating test
            name: Test name
            templates: List of template IDs to test
            posts_per_template: How many posts per template
            duration_days: How long to run test
            description: Optional description

        Returns:
            Created VariantSet

        Raises:
            ValidationError: If input invalid
        """
        try:
            if len(templates) < 2:
                raise ValidationError("Must test at least 2 templates")

            if len(templates) > 10:
                raise ValidationError("Cannot test more than 10 templates")

            if posts_per_template < 1 or posts_per_template > 50:
                raise ValidationError("posts_per_template must be 1-50")

            if duration_days < 1 or duration_days > 90:
                raise ValidationError("duration_days must be 1-90")

            set_id = f"variant_{uuid4().hex[:12]}"
            end_date = datetime.utcnow() + timedelta(days=duration_days)

            variant_set = VariantSet(
                id=set_id,
                team_id=team_id,
                user_id=user_id,
                name=name,
                description=description,
                templates=templates,
                posts_per_template=posts_per_template,
                total_duration_days=duration_days,
                status="active",
                end_date=end_date,
            )

            variant_set = await variant_set_repo.create(db, variant_set)
            logger.info(
                f"Variant set created: {set_id} with {len(templates)} templates"
            )

            return variant_set

        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to create variant set: {e}", exc_info=True)
            raise ExternalServiceError("Failed to create variant set")

    async def get_variant_set(
        self, db: AsyncSession, variant_set_id: str
    ) -> VariantSet:
        """Get variant set by ID."""
        try:
            variant_set = await variant_set_repo.get(db, variant_set_id)
            if not variant_set:
                raise NotFoundError("VariantSet", variant_set_id)
            return variant_set
        except Exception as e:
            logger.error(f"Failed to fetch variant set: {e}")
            raise ExternalServiceError("Failed to fetch variant set")

    async def complete_variant_set(
        self, db: AsyncSession, variant_set_id: str
    ) -> VariantSet:
        """
        Mark variant set as completed and calculate final results.

        Aggregates performance across all variants.
        """
        try:
            variant_set = await variant_set_repo.get(db, variant_set_id)
            if not variant_set:
                raise NotFoundError("VariantSet", variant_set_id)

            # Get performance for all variants
            performances = await variant_perf_repo.get_by_variant_set(
                db, variant_set_id
            )

            if not performances:
                raise ValidationError("No performance data for variant set")

            # Determine winner (highest overall score)
            winner = max(performances, key=lambda p: p.overall_score)
            winner.is_winning = True
            await variant_perf_repo.update(db, winner)

            # Build results
            stats = {
                p.template_id: {
                    "avg_impressions": p.avg_impressions,
                    "avg_engagement": p.avg_engagement,
                    "engagement_rate": p.avg_engagement_rate,
                    "total_posts": p.total_posts,
                }
                for p in performances
            }

            insights = self._generate_insights(performances, winner)

            results = {
                "winning_template_id": winner.template_id,
                "confidence_score": winner.confidence_score,
                "stats": stats,
                "insights": insights,
            }

            # Update variant set
            variant_set.status = "completed"
            variant_set.completed_at = datetime.utcnow()
            variant_set.results = results
            variant_set = await variant_set_repo.update(db, variant_set)

            logger.info(
                f"Variant set completed: {variant_set_id}, winner: {winner.template_id}"
            )
            return variant_set

        except (NotFoundError, ValidationError):
            raise
        except Exception as e:
            logger.error(f"Failed to complete variant set: {e}", exc_info=True)
            raise ExternalServiceError("Failed to complete variant set")

    def _generate_insights(
        self, performances: list[VariantPerfornance], winner: VariantPerfornance
    ) -> list[str]:
        """Generate insights from variant performance data."""
        insights = []

        # Winner insight
        margin = (
            (winner.overall_score - min(p.overall_score for p in performances))
            / min(p.overall_score for p in performances if p.overall_score > 0)
            * 100
        )
        insights.append(f"Winner outperforms by {margin:.1f}%")

        # Engagement insight
        if winner.avg_engagement_rate > 5.0:
            insights.append(
                "High engagement template - consider replicating structure for other campaigns"
            )

        # Confidence insight
        if winner.confidence_score > 0.95:
            insights.append(
                "Strong confidence in results - template is statistically significant winner"
            )
        elif winner.confidence_score < 0.7:
            insights.append(
                "Low confidence - consider running test longer for more data"
            )

        return insights

    async def pause_variant_set(
        self, db: AsyncSession, variant_set_id: str
    ) -> VariantSet:
        """Pause an active variant set."""
        try:
            variant_set = await variant_set_repo.get(db, variant_set_id)
            if not variant_set:
                raise NotFoundError("VariantSet", variant_set_id)

            if variant_set.status != "active":
                raise ValidationError("Can only pause active variant sets")

            variant_set.status = "paused"
            variant_set = await variant_set_repo.update(db, variant_set)

            logger.info(f"Variant set paused: {variant_set_id}")
            return variant_set

        except (NotFoundError, ValidationError):
            raise
        except Exception as e:
            logger.error(f"Failed to pause variant set: {e}")
            raise ExternalServiceError("Failed to pause variant set")


# Module-level singleton
variants_service = VariantsService()
