import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './useAuth';
import {
  registerPushToken,
  removePushToken,
} from '../services/notifications';

// Configure notification handler (show in foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const router = useRouter();
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function setup() {
      // Push notifications don't work on web
      if (Platform.OS === 'web') return;

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.warn('Missing EAS projectId — push notifications disabled');
        return;
      }

      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      tokenRef.current = pushToken.data;
      await registerPushToken(userId!, pushToken.data);
    }

    setup().catch(console.error);

    return () => {
      if (tokenRef.current) {
        removePushToken(tokenRef.current).catch(console.error);
      }
    };
  }, [userId]);

  // Handle notification tap — navigate based on type
  useEffect(() => {
    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.type === 'friend_checkin' && data?.parkId) {
          router.push(`/dog-parks/${data.parkId}` as never);
        } else if (data?.conversationId) {
          router.push(`/messages/${data.conversationId}` as never);
        }
      });

    return () => subscription.remove();
  }, [router]);
}
