import { useCallback, useEffect, useState } from 'react';
import { getUserRecentCheckIns } from '../services/checkins';
import { getRecentFriendships } from '../services/friends';
import { getMyPlayDates } from '../services/playdates';
import type { CheckIn, Friendship, PlayDate } from '../types/database';
import { formatDistanceToNow } from 'date-fns';

export type ActivityType = 'check_in' | 'playdate' | 'friendship';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  timestamp: Date;
  icon: 'checkmark-circle' | 'calendar' | 'people';
  iconColor: string;
  iconBgColor: string;
}

interface UseRecentActivityReturn {
  activities: ActivityItem[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useRecentActivity(userId: string | undefined): UseRecentActivityReturn {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivity = useCallback(async () => {
    if (!userId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch all data in parallel
      const [checkIns, friendships, playdates] = await Promise.all([
        getUserRecentCheckIns(userId, 5),
        getRecentFriendships(userId, 5),
        getMyPlayDates(userId),
      ]);

      const items: ActivityItem[] = [];

      // Process check-ins
      checkIns.forEach((checkIn: CheckIn) => {
        const parkName = checkIn.park?.name || 'a park';
        items.push({
          id: `checkin-${checkIn.id}`,
          type: 'check_in',
          title: `Checked in at ${parkName}`,
          subtitle: formatDistanceToNow(new Date(checkIn.checked_in_at), { addSuffix: true }),
          timestamp: new Date(checkIn.checked_in_at),
          icon: 'checkmark-circle',
          iconColor: '#3D8A5A',
          iconBgColor: '#E8F5E9',
        });
      });

      // Process friendships - show who the user became friends with
      friendships.forEach((friendship: Friendship) => {
        const isRequester = friendship.requester_id === userId;
        const friend = isRequester ? friendship.addressee : friendship.requester;
        const friendName = friend?.display_name || friend?.email?.split('@')[0] || 'someone';
        
        items.push({
          id: `friendship-${friendship.id}`,
          type: 'friendship',
          title: `Became friends with ${friendName}`,
          subtitle: formatDistanceToNow(new Date(friendship.updated_at), { addSuffix: true }),
          timestamp: new Date(friendship.updated_at),
          icon: 'people',
          iconColor: '#3D8A5A',
          iconBgColor: '#E8F5E9',
        });
      });

      // Process playdates (only past ones for activity)
      const now = new Date();
      const pastPlaydates = playdates.filter(
        (pd: PlayDate) => new Date(pd.starts_at) < now
      );
      
      pastPlaydates.slice(0, 5).forEach((playdate: PlayDate) => {
        const parkName = playdate.park?.name || 'a park';
        items.push({
          id: `playdate-${playdate.id}`,
          type: 'playdate',
          title: `Play date at ${parkName}`,
          subtitle: formatDistanceToNow(new Date(playdate.starts_at), { addSuffix: true }),
          timestamp: new Date(playdate.starts_at),
          icon: 'calendar',
          iconColor: '#3D8A5A',
          iconBgColor: '#E8F5E9',
        });
      });

      // Sort all activities by timestamp (most recent first) and take top 5
      items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setActivities(items.slice(0, 5));
    } catch (err) {
      console.error('Failed to load recent activity:', err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  return { activities, loading, refresh: loadActivity };
}
