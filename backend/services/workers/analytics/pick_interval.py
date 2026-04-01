from datetime import timedelta
from enum import Enum


class Interval(Enum):
    HOURLY = ("hourly", timedelta(hours=1), 24)  # <= 24h
    DAILY = ("daily", timedelta(days=1), 7 * 24)  # 1–7 days
    WEEKLY = ("weekly", timedelta(days=7), 28 * 24)  # 8–28 days
    MONTHLY = ("monthly", timedelta(days=30), 90 * 24)  # 29–90 days

    def __init__(self, key, delta, max_age_hours):
        self.key = key
        self.delta = delta
        self.max_age_hours = max_age_hours


def pick_interval(post_age_hours: float) -> Interval | None:
    if post_age_hours <= Interval.HOURLY.max_age_hours:
        return Interval.HOURLY
    if post_age_hours <= Interval.DAILY.max_age_hours:
        return Interval.DAILY
    if post_age_hours <= Interval.WEEKLY.max_age_hours:
        return Interval.WEEKLY
    if post_age_hours <= Interval.MONTHLY.max_age_hours:
        return Interval.MONTHLY
    return None  # stop tracking after ~3 months
