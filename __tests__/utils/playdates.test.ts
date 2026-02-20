import {
  isPlaydateExpired,
  isPlaydateActive,
  canRSVPToPlaydate,
  canEditPlaydate,
  getPlaydateStatus,
  formatPlaydateTime,
  isPastPlaydate,
  isUpcomingPlaydate,
  sortPlaydatesByTime,
  filterPlaydatesByTime,
} from '../../src/utils/playdates';
import type { PlayDate } from '../../src/types/database';

describe('PlayDate Utils', () => {
  describe('isPlaydateExpired', () => {
    it('returns true for past play dates', () => {
      const playdate = {
        ends_at: new Date(Date.now() - 1000).toISOString(),
      } as Pick<PlayDate, 'ends_at'>;

      expect(isPlaydateExpired(playdate)).toBe(true);
    });

    it('returns false for future play dates', () => {
      const playdate = {
        ends_at: new Date(Date.now() + 3600000).toISOString(),
      } as Pick<PlayDate, 'ends_at'>;

      expect(isPlaydateExpired(playdate)).toBe(false);
    });

    it('returns true for play dates that ended 1 second ago', () => {
      const playdate = {
        ends_at: new Date(Date.now() - 1000).toISOString(),
      } as Pick<PlayDate, 'ends_at'>;

      expect(isPlaydateExpired(playdate)).toBe(true);
    });
  });

  describe('isPlaydateActive', () => {
    it('returns true for scheduled play dates in the future', () => {
      const playdate = {
        status: 'scheduled',
        ends_at: new Date(Date.now() + 3600000).toISOString(),
      } as Pick<PlayDate, 'status' | 'ends_at'>;

      expect(isPlaydateActive(playdate)).toBe(true);
    });

    it('returns false for expired play dates', () => {
      const playdate = {
        status: 'scheduled',
        ends_at: new Date(Date.now() - 1000).toISOString(),
      } as Pick<PlayDate, 'status' | 'ends_at'>;

      expect(isPlaydateActive(playdate)).toBe(false);
    });

    it('returns false for cancelled play dates', () => {
      const playdate = {
        status: 'cancelled',
        ends_at: new Date(Date.now() + 3600000).toISOString(),
      } as Pick<PlayDate, 'status' | 'ends_at'>;

      expect(isPlaydateActive(playdate)).toBe(false);
    });

    it('returns false for completed play dates', () => {
      const playdate = {
        status: 'completed',
        ends_at: new Date(Date.now() + 3600000).toISOString(),
      } as Pick<PlayDate, 'status' | 'ends_at'>;

      expect(isPlaydateActive(playdate)).toBe(false);
    });
  });

  describe('canRSVPToPlaydate', () => {
    it('returns true for active scheduled play dates', () => {
      const playdate = {
        status: 'scheduled',
        ends_at: new Date(Date.now() + 3600000).toISOString(),
      } as Pick<PlayDate, 'status' | 'ends_at'>;

      expect(canRSVPToPlaydate(playdate)).toBe(true);
    });

    it('returns false for expired play dates', () => {
      const playdate = {
        status: 'scheduled',
        ends_at: new Date(Date.now() - 1000).toISOString(),
      } as Pick<PlayDate, 'status' | 'ends_at'>;

      expect(canRSVPToPlaydate(playdate)).toBe(false);
    });

    it('returns false for cancelled play dates', () => {
      const playdate = {
        status: 'cancelled',
        ends_at: new Date(Date.now() + 3600000).toISOString(),
      } as Pick<PlayDate, 'status' | 'ends_at'>;

      expect(canRSVPToPlaydate(playdate)).toBe(false);
    });
  });

  describe('canEditPlaydate', () => {
    it('returns true for organizer of active play date', () => {
      const playdate = {
        status: 'scheduled',
        ends_at: new Date(Date.now() + 3600000).toISOString(),
        organizer_id: 'user-123',
      } as Pick<PlayDate, 'status' | 'ends_at' | 'organizer_id'>;

      expect(canEditPlaydate(playdate, 'user-123')).toBe(true);
    });

    it('returns false for non-organizer', () => {
      const playdate = {
        status: 'scheduled',
        ends_at: new Date(Date.now() + 3600000).toISOString(),
        organizer_id: 'user-123',
      } as Pick<PlayDate, 'status' | 'ends_at' | 'organizer_id'>;

      expect(canEditPlaydate(playdate, 'user-456')).toBe(false);
    });

    it('returns false for expired play dates even for organizer', () => {
      const playdate = {
        status: 'scheduled',
        ends_at: new Date(Date.now() - 1000).toISOString(),
        organizer_id: 'user-123',
      } as Pick<PlayDate, 'status' | 'ends_at' | 'organizer_id'>;

      expect(canEditPlaydate(playdate, 'user-123')).toBe(false);
    });

    it('returns true for admin even if not organizer', () => {
      const playdate = {
        status: 'scheduled',
        ends_at: new Date(Date.now() + 3600000).toISOString(),
        organizer_id: 'user-123',
      } as Pick<PlayDate, 'status' | 'ends_at' | 'organizer_id'>;

      expect(canEditPlaydate(playdate, 'admin-456', true)).toBe(true);
    });

    it('returns true for admin even for expired play dates', () => {
      const playdate = {
        status: 'scheduled',
        ends_at: new Date(Date.now() - 1000).toISOString(),
        organizer_id: 'user-123',
      } as Pick<PlayDate, 'status' | 'ends_at' | 'organizer_id'>;

      expect(canEditPlaydate(playdate, 'admin-456', true)).toBe(true);
    });
  });

  describe('getPlaydateStatus', () => {
    it('returns Cancelled for cancelled play dates', () => {
      const playdate = {
        status: 'cancelled',
        starts_at: new Date().toISOString(),
        ends_at: new Date().toISOString(),
      } as Pick<PlayDate, 'status' | 'starts_at' | 'ends_at'>;

      const result = getPlaydateStatus(playdate);
      expect(result.label).toBe('Cancelled');
      expect(result.color).toBe('#EF4444');
    });

    it('returns Completed for completed play dates', () => {
      const playdate = {
        status: 'completed',
        starts_at: new Date().toISOString(),
        ends_at: new Date().toISOString(),
      } as Pick<PlayDate, 'status' | 'starts_at' | 'ends_at'>;

      const result = getPlaydateStatus(playdate);
      expect(result.label).toBe('Completed');
      expect(result.color).toBe('#6B7280');
    });

    it('returns Completed for expired play dates', () => {
      const playdate = {
        status: 'scheduled',
        starts_at: new Date(Date.now() - 7200000).toISOString(),
        ends_at: new Date(Date.now() - 3600000).toISOString(),
      } as Pick<PlayDate, 'status' | 'starts_at' | 'ends_at'>;

      const result = getPlaydateStatus(playdate);
      expect(result.label).toBe('Completed');
    });

    it('returns Starting Soon for play dates starting within 1 hour', () => {
      const playdate = {
        status: 'scheduled',
        starts_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
        ends_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      } as Pick<PlayDate, 'status' | 'starts_at' | 'ends_at'>;

      const result = getPlaydateStatus(playdate);
      expect(result.label).toBe('Starting Soon');
      expect(result.color).toBe('#F59E0B');
    });

    it('returns Scheduled for future play dates', () => {
      const playdate = {
        status: 'scheduled',
        starts_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        ends_at: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
      } as Pick<PlayDate, 'status' | 'starts_at' | 'ends_at'>;

      const result = getPlaydateStatus(playdate);
      expect(result.label).toBe('Scheduled');
      expect(result.color).toBe('#10B981');
    });
  });

  describe('formatPlaydateTime', () => {
    it('formats time range correctly', () => {
      const startsAt = new Date('2024-01-15T14:00:00').toISOString();
      const endsAt = new Date('2024-01-15T16:30:00').toISOString();

      const result = formatPlaydateTime(startsAt, endsAt);

      expect(result.timeRange).toContain('2:00');
      expect(result.timeRange).toContain('4:30');
      expect(result.duration).toBe('2h 30m');
    });

    it('shows "Today" for today\'s date', () => {
      const today = new Date();
      const startsAt = today.toISOString();
      const endsAt = new Date(today.getTime() + 2 * 60 * 60 * 1000).toISOString();

      const result = formatPlaydateTime(startsAt, endsAt);

      expect(result.date).toBe('Today');
    });

    it('shows "Tomorrow" for tomorrow\'s date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startsAt = tomorrow.toISOString();
      const endsAt = new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString();

      const result = formatPlaydateTime(startsAt, endsAt);

      expect(result.date).toBe('Tomorrow');
    });
  });

  describe('sortPlaydatesByTime', () => {
    it('sorts by start time in ascending order', () => {
      const playdates = [
        { id: '1', starts_at: new Date('2024-01-15T16:00:00').toISOString(), ends_at: new Date().toISOString(), status: 'scheduled' },
        { id: '2', starts_at: new Date('2024-01-15T10:00:00').toISOString(), ends_at: new Date().toISOString(), status: 'scheduled' },
        { id: '3', starts_at: new Date('2024-01-15T14:00:00').toISOString(), ends_at: new Date().toISOString(), status: 'scheduled' },
      ] as PlayDate[];

      const sorted = sortPlaydatesByTime(playdates, 'asc');

      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('1');
    });

    it('sorts by start time in descending order', () => {
      const playdates = [
        { id: '1', starts_at: new Date('2024-01-15T16:00:00').toISOString(), ends_at: new Date().toISOString(), status: 'scheduled' },
        { id: '2', starts_at: new Date('2024-01-15T10:00:00').toISOString(), ends_at: new Date().toISOString(), status: 'scheduled' },
        { id: '3', starts_at: new Date('2024-01-15T14:00:00').toISOString(), ends_at: new Date().toISOString(), status: 'scheduled' },
      ] as PlayDate[];

      const sorted = sortPlaydatesByTime(playdates, 'desc');

      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('2');
    });
  });

  describe('filterPlaydatesByTime', () => {
    it('separates upcoming and past play dates', () => {
      const now = Date.now();
      const playdates = [
        { id: '1', starts_at: new Date(now - 3600000).toISOString(), ends_at: new Date(now - 1800000).toISOString(), status: 'scheduled' },
        { id: '2', starts_at: new Date(now + 3600000).toISOString(), ends_at: new Date(now + 7200000).toISOString(), status: 'scheduled' },
        { id: '3', starts_at: new Date(now - 7200000).toISOString(), ends_at: new Date(now - 3600000).toISOString(), status: 'completed' },
        { id: '4', starts_at: new Date(now + 7200000).toISOString(), ends_at: new Date(now + 10800000).toISOString(), status: 'scheduled' },
      ] as PlayDate[];

      const { upcoming, past } = filterPlaydatesByTime(playdates);

      expect(upcoming.length).toBe(2);
      expect(past.length).toBe(2);
      expect(upcoming.map(p => p.id)).toContain('2');
      expect(upcoming.map(p => p.id)).toContain('4');
      expect(past.map(p => p.id)).toContain('1');
      expect(past.map(p => p.id)).toContain('3');
    });

    it('sorts upcoming in ascending order', () => {
      const now = Date.now();
      const playdates = [
        { id: '1', starts_at: new Date(now + 7200000).toISOString(), ends_at: new Date(now + 10800000).toISOString(), status: 'scheduled' },
        { id: '2', starts_at: new Date(now + 3600000).toISOString(), ends_at: new Date(now + 7200000).toISOString(), status: 'scheduled' },
      ] as PlayDate[];

      const { upcoming } = filterPlaydatesByTime(playdates);

      expect(upcoming[0].id).toBe('2');
      expect(upcoming[1].id).toBe('1');
    });

    it('sorts past in descending order', () => {
      const now = Date.now();
      const playdates = [
        { id: '1', starts_at: new Date(now - 7200000).toISOString(), ends_at: new Date(now - 3600000).toISOString(), status: 'completed' },
        { id: '2', starts_at: new Date(now - 3600000).toISOString(), ends_at: new Date(now - 1800000).toISOString(), status: 'completed' },
      ] as PlayDate[];

      const { past } = filterPlaydatesByTime(playdates);

      expect(past[0].id).toBe('2');
      expect(past[1].id).toBe('1');
    });
  });
});
