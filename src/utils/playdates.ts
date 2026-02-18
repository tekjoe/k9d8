import type { PlayDate } from '../types/database';

/**
 * Check if a play date has expired (ended)
 */
export function isPlaydateExpired(playdate: Pick<PlayDate, 'ends_at'>): boolean {
  return new Date(playdate.ends_at) < new Date();
}

/**
 * Check if a play date is active (scheduled and not expired)
 */
export function isPlaydateActive(playdate: Pick<PlayDate, 'status' | 'ends_at'>): boolean {
  return playdate.status === 'scheduled' && !isPlaydateExpired(playdate);
}

/**
 * Check if user can RSVP to a play date
 */
export function canRSVPToPlaydate(playdate: Pick<PlayDate, 'status' | 'ends_at'>): boolean {
  return isPlaydateActive(playdate);
}

/**
 * Check if user can edit a play date
 */
export function canEditPlaydate(
  playdate: Pick<PlayDate, 'status' | 'ends_at' | 'organizer_id'>,
  userId: string,
  isAdmin: boolean = false
): boolean {
  // Admin can always edit
  if (isAdmin) return true;

  // Organizer can edit only if not expired
  if (playdate.organizer_id !== userId) return false;

  return isPlaydateActive(playdate);
}

/**
 * Format expiration status for UI
 */
export function getPlaydateStatus(playdate: Pick<PlayDate, 'status' | 'starts_at' | 'ends_at'>): {
  label: string;
  color: string;
  icon: string;
} {
  if (playdate.status === 'cancelled') {
    return { label: 'Cancelled', color: '#EF4444', icon: 'close-circle' };
  }

  if (playdate.status === 'completed' || isPlaydateExpired(playdate)) {
    return { label: 'Completed', color: '#6B7280', icon: 'checkmark-circle' };
  }

  if (playdate.status === 'scheduled') {
    const isStartingSoon =
      new Date(playdate.starts_at).getTime() - Date.now() < 60 * 60 * 1000; // 1 hour
    if (isStartingSoon) {
      return { label: 'Starting Soon', color: '#F59E0B', icon: 'time' };
    }
    return { label: 'Scheduled', color: '#10B981', icon: 'calendar' };
  }

  return { label: 'Unknown', color: '#6B7280', icon: 'help-circle' };
}

/**
 * Format date and time for display
 */
export function formatPlaydateTime(
  startsAt: string,
  endsAt: string
): {
  date: string;
  timeRange: string;
  duration: string;
} {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  // Date: "Monday, Jan 15" or "Today" or "Tomorrow"
  const now = new Date();
  const isToday = start.toDateString() === now.toDateString();
  const isTomorrow = new Date(now.setDate(now.getDate() + 1)).toDateString() === start.toDateString();

  let date: string;
  if (isToday) {
    date = 'Today';
  } else if (isTomorrow) {
    date = 'Tomorrow';
  } else {
    date = start.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }

  // Time range: "2:00 PM - 4:00 PM"
  const timeRange = `${start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })} - ${end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;

  // Duration: "2 hours" or "30 minutes"
  const durationMs = end.getTime() - start.getTime();
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  let duration: string;
  if (durationHours > 0 && durationMinutes > 0) {
    duration = `${durationHours}h ${durationMinutes}m`;
  } else if (durationHours > 0) {
    duration = `${durationHours} hour${durationHours > 1 ? 's' : ''}`;
  } else {
    duration = `${durationMinutes} min`;
  }

  return { date, timeRange, duration };
}

/**
 * Check if a play date is in the past
 */
export function isPastPlaydate(playdate: Pick<PlayDate, 'ends_at'>): boolean {
  return isPlaydateExpired(playdate);
}

/**
 * Check if a play date is upcoming (scheduled and in the future)
 */
export function isUpcomingPlaydate(playdate: Pick<PlayDate, 'status' | 'starts_at'>): boolean {
  return playdate.status === 'scheduled' && new Date(playdate.starts_at) > new Date();
}

/**
 * Sort play dates by start time (upcoming first, then past)
 */
export function sortPlaydatesByTime(
  playdates: PlayDate[],
  direction: 'asc' | 'desc' = 'asc'
): PlayDate[] {
  return [...playdates].sort((a, b) => {
    const aTime = new Date(a.starts_at).getTime();
    const bTime = new Date(b.starts_at).getTime();
    return direction === 'asc' ? aTime - bTime : bTime - aTime;
  });
}

/**
 * Filter play dates into upcoming and past
 */
export function filterPlaydatesByTime(
  playdates: PlayDate[]
): {
  upcoming: PlayDate[];
  past: PlayDate[];
} {
  const upcoming: PlayDate[] = [];
  const past: PlayDate[] = [];

  for (const playdate of playdates) {
    if (isPlaydateActive(playdate) || isUpcomingPlaydate(playdate)) {
      upcoming.push(playdate);
    } else {
      past.push(playdate);
    }
  }

  return {
    upcoming: sortPlaydatesByTime(upcoming, 'asc'),
    past: sortPlaydatesByTime(past, 'desc'),
  };
}
