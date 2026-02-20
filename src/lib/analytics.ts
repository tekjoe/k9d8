import analytics from '@react-native-firebase/analytics';

const noop = async () => {};

export const Analytics = {
  setUserId: async (userId: string) => {
    try {
      await analytics().setUserId(userId);
    } catch (e) {
      // Firebase not available (web)
    }
  },

  logScreenView: async (screenName: string) => {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
      });
    } catch (e) {}
  },

  logEvent: async (name: string, params?: Record<string, unknown>) => {
    try {
      await analytics().logEvent(name, params);
    } catch (e) {}
  },

  logAppOpen: async () => {
    try {
      await analytics().logAppOpen();
    } catch (e) {}
  },

  logSignup: async (method: string) => {
    try {
      await analytics().logSignUp({ method });
    } catch (e) {}
  },

  logLogin: async (method: string) => {
    try {
      await analytics().logLogin({ method });
    } catch (e) {}
  },

  logCheckIn: async (parkId: string, parkName: string) => {
    try {
      await analytics().logEvent('check_in', {
        park_id: parkId,
        park_name: parkName,
      });
    } catch (e) {}
  },

  logPlaydateCreate: async (playdateId: string) => {
    try {
      await analytics().logEvent('playdate_create', {
        playdate_id: playdateId,
      });
    } catch (e) {}
  },

  logPlaydateJoin: async (playdateId: string) => {
    try {
      await analytics().logEvent('playdate_join', {
        playdate_id: playdateId,
      });
    } catch (e) {}
  },

  logMessageSend: async (conversationId: string) => {
    try {
      await analytics().logEvent('message_send', {
        conversation_id: conversationId,
      });
    } catch (e) {}
  },

  logSearch: async (query: string, resultsCount: number) => {
    try {
      await analytics().logSearch({
        search_term: query,
        results_count: resultsCount,
      });
    } catch (e) {}
  },
};
