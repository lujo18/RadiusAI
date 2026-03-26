"""
Team ORM Models for multi-tenant team-based access control and audit logging.

Tracks teams, members, roles, and audit events.
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, DateTime, JSON, ForeignKey, Index, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base


class TeamRole(str, enum.Enum):
    """Team member roles with hierarchical permissions."""
    OWNER = "owner"        # Full access, can delete team, manage members
    ADMIN = "admin"        # Admin access, can manage members, update team
    MEMBER = "member"      # Regular member, can view and create content
    VIEWER = "viewer"      # Read-only access


class TeamMemberStatus(str, enum.Enum):
    """Status of team membership."""
    ACTIVE = "active"
    PENDING = "pending"    # Invited but not accepted
    INVITED = "invited"    # Email invitation sent
    REMOVED = "removed"


class Team(Base):
    """
    Represents a team for multi-user collaboration.
    
    Each team has:
    - One owner (the user who created it)
    - Multiple members with different roles
    - Shared brands, templates, posts
    """
    
    __tablename__ = "teams"
    
    # Primary Key
    id: Mapped[str] = mapped_column(String(50), primary_key=True)  # team_{uuid}
    
    # Foreign Keys
    owner_id: Mapped[str] = mapped_column(String(255), ForeignKey("users.id"), nullable=False)
    
    # Basic info
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Settings
    team_settings: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Team-wide settings
    team_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.utcnow()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.utcnow(),
        onupdate=lambda: datetime.utcnow()
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    members: Mapped[List["TeamMember"]] = relationship(
        "TeamMember",
        back_populates="team",
        cascade="all, delete-orphan"
    )
    events: Mapped[List["TeamEvent"]] = relationship(
        "TeamEvent",
        back_populates="team",
        cascade="all, delete-orphan"
    )
    
    # Indexes
    __table_args__ = (
        Index("ix_team_owner_id", "owner_id"),
        Index("ix_team_slug", "slug", unique=True),
        Index("ix_team_deleted_at", "deleted_at"),
    )


class TeamMember(Base):
    """
    Represents a user's membership in a team.
    
    Tracks role, status, and permissions.
    """
    
    __tablename__ = "team_members"
    
    # Primary Key & Foreign Keys
    id: Mapped[str] = mapped_column(String(50), primary_key=True)  # tmem_{uuid}
    team_id: Mapped[str] = mapped_column(String(50), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(255), ForeignKey("users.id"), nullable=False)
    
    # Membership info
    role: Mapped[str] = mapped_column(String(20), default=TeamRole.MEMBER.value)
    status: Mapped[str] = mapped_column(String(20), default=TeamMemberStatus.ACTIVE.value)
    
    # Invitation tracking
    invited_by: Mapped[Optional[str]] = mapped_column(String(255), ForeignKey("users.id"), nullable=True)
    invited_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Metadata
    member_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.utcnow()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.utcnow(),
        onupdate=lambda: datetime.utcnow()
    )
    
    # Relationships
    team: Mapped["Team"] = relationship("Team", back_populates="members")
    
    # Indexes
    __table_args__ = (
        Index("ix_team_member_team_id", "team_id"),
        Index("ix_team_member_user_id", "user_id"),
        Index("ix_team_member_role", "role"),
        Index("ix_team_member_status", "status"),
        Index("ix_team_member_team_user", "team_id", "user_id", unique=True),  # One membership per user per team
    )


class TeamEvent(Base):
    """
    Audit log for team activities (creates, updates, member changes, etc).
    """
    
    __tablename__ = "team_events"
    
    # Primary Key
    id: Mapped[str] = mapped_column(String(50), primary_key=True)  # tev_{uuid}
    
    # Foreign Keys
    team_id: Mapped[str] = mapped_column(String(50), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    actor_id: Mapped[Optional[str]] = mapped_column(String(255), ForeignKey("users.id"), nullable=True)
    
    # Event info
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)  # team_created, member_added, role_changed, etc
    subject_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # user/member affected by event
    
    # Event payload
    payload: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Event-specific data
    
    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.utcnow()
    )
    
    # Relationships
    team: Mapped["Team"] = relationship("Team", back_populates="events")
    
    # Indexes
    __table_args__ = (
        Index("ix_team_event_team_id", "team_id"),
        Index("ix_team_event_actor_id", "actor_id"),
        Index("ix_team_event_type", "event_type"),
        Index("ix_team_event_created_at", "created_at"),
    )
