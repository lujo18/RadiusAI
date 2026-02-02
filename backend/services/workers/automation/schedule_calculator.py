"""
Schedule calculator for automations.

Computes the next execution time based on a schedule JSON object.

Schedule format:
{
    "monday": ["09:00", "14:00"],
    "tuesday": ["09:00"],
    "wednesday": ["14:00", "17:00"],
    ...
}

Weekdays: monday, tuesday, wednesday, thursday, friday, saturday, sunday
Times: HH:MM in 24-hour format
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# Map weekday names to numbers (0=Monday, 6=Sunday)
WEEKDAY_NAMES = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}


def compute_next_run(schedule: Dict[str, List[str]]) -> datetime:
    """
    Compute the next execution time based on schedule.
    
    Args:
        schedule: Dict with weekday names as keys and lists of HH:MM times as values
                 Example: {"monday": ["09:00", "14:00"], "friday": ["12:00"]}
    
    Returns:
        datetime object representing next execution time (in UTC)
        
    Raises:
        ValueError: If schedule is empty or malformed
    """
    if not schedule or not isinstance(schedule, dict):
        raise ValueError("Schedule must be a non-empty dict")
    
    # Get current time in UTC
    now = datetime.now(timezone.utc)
    
    # Try to find the next execution time
    next_run = _find_next_execution(now, schedule)
    
    if not next_run:
        raise ValueError(f"Could not compute next run time from schedule: {schedule}")
    
    logger.info(f"Computed next_run_at: {next_run.isoformat()} (current: {now.isoformat()})")
    
    return next_run


def _find_next_execution(current_time: datetime, schedule: Dict[str, List[str]]) -> Optional[datetime]:
    """
    Find the next execution time starting from current_time.
    
    Algorithm:
    1. For today, find any time > now
    2. If found, return today + time
    3. Otherwise, look ahead day by day for up to 7 days
    4. If no time found in 7 days, loop back to week and pick first available
    
    Args:
        current_time: Current datetime (UTC)
        schedule: Schedule dict
        
    Returns:
        Next execution datetime or None if no valid time found
    """
    # Normalize schedule keys to lowercase
    normalized_schedule = {k.lower(): v for k, v in schedule.items()}
    
    # Check up to 14 days ahead
    for days_ahead in range(14):
        check_date = current_time + timedelta(days=days_ahead)
        weekday_name = check_date.strftime("%A").lower()
        
        if weekday_name not in normalized_schedule:
            continue
        
        times = normalized_schedule[weekday_name]
        if not times:
            continue
        
        # Parse times and find next execution
        for time_str in times:
            try:
                # Parse HH:MM format
                parts = time_str.split(":")
                if len(parts) != 2:
                    logger.warning(f"Invalid time format: {time_str}")
                    continue
                
                hour = int(parts[0])
                minute = int(parts[1])
                
                # Create datetime for this time
                candidate = check_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                
                # If this is today and time has passed, skip
                if days_ahead == 0 and candidate <= current_time:
                    continue
                
                # Return this candidate if it's in the future
                if candidate > current_time:
                    return candidate
                    
            except (ValueError, IndexError) as e:
                logger.warning(f"Could not parse time {time_str}: {e}")
                continue
    
    # Fallback: if no time found, pick the earliest time from the schedule
    # starting from next week
    for weekday_name, times in normalized_schedule.items():
        if times:
            try:
                time_str = sorted(times)[0]  # Pick earliest time
                parts = time_str.split(":")
                hour = int(parts[0])
                minute = int(parts[1])
                
                # Find next occurrence of this weekday
                weekday_num = WEEKDAY_NAMES.get(weekday_name)
                if weekday_num is not None:
                    days_until_weekday = (weekday_num - current_time.weekday()) % 7
                    if days_until_weekday == 0:
                        days_until_weekday = 7  # Next week if today is the same weekday
                    
                    next_date = current_time + timedelta(days=days_until_weekday)
                    next_run = next_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                    
                    if next_run > current_time:
                        return next_run
            except (ValueError, IndexError) as e:
                logger.warning(f"Could not process fallback time: {e}")
                continue
    
    return None


def validate_schedule(schedule: Dict[str, List[str]]) -> bool:
    """
    Validate that a schedule dict has correct format.
    
    Requirements:
    - Non-empty dict
    - Keys are valid weekday names (lowercase)
    - Values are lists of valid HH:MM time strings
    
    Args:
        schedule: Schedule dict to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not isinstance(schedule, dict) or not schedule:
        logger.error("Schedule must be a non-empty dict")
        return False
    
    for weekday, times in schedule.items():
        # Validate weekday name
        if weekday.lower() not in WEEKDAY_NAMES:
            logger.error(f"Invalid weekday: {weekday}")
            return False
        
        # Validate times list
        if not isinstance(times, list):
            logger.error(f"Times for {weekday} must be a list, got {type(times)}")
            return False
        
        for time_str in times:
            if not isinstance(time_str, str):
                logger.error(f"Time {time_str} must be string, got {type(time_str)}")
                return False
            
            # Validate HH:MM format
            parts = time_str.split(":")
            if len(parts) != 2:
                logger.error(f"Invalid time format: {time_str} (expected HH:MM)")
                return False
            
            try:
                hour = int(parts[0])
                minute = int(parts[1])
                if not (0 <= hour < 24) or not (0 <= minute < 60):
                    logger.error(f"Time out of range: {time_str}")
                    return False
            except ValueError:
                logger.error(f"Could not parse time: {time_str}")
                return False
    
    return True
