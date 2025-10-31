import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  seenAlertIds: [],
  audioEnabled: false,
  isBootstrapped: false,
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    /* ---------------- ADD / UPDATE ---------------- */
    addNotifications: (state, action) => {
      state.notifications = [...action.payload, ...state.notifications];
      if (state.notifications.length > 100) {
        state.notifications = state.notifications.slice(0, 100);
      }
    },

    /* ---------------- CLEAR ---------------- */
    clearNotifications: (state) => {
      state.notifications = [];
    },

    /* ---------------- SEEN ALERTS ---------------- */
    addSeenAlertId: (state, action) => {
      if (!state.seenAlertIds.includes(action.payload)) {
        state.seenAlertIds.push(action.payload);
      }
    },

    addMultipleSeenAlertIds: (state, action) => {
      action.payload.forEach((id) => {
        if (!state.seenAlertIds.includes(id)) {
          state.seenAlertIds.push(id);
        }
      });
    },

    /* ---------------- MARK READ (Called by RTK Query mutations) ---------------- */
    markAlertAsRead: (state, action) => {
      const alertId = action.payload;
      const notification = state.notifications.find(n => n.id === alertId);
      if (notification) {
        notification.is_read = true;
      }
      if (!state.seenAlertIds.includes(alertId)) {
        state.seenAlertIds.push(alertId);
      }
    },

    markMultipleAlertsAsRead: (state, action) => {
      action.payload.forEach((alertId) => {
        const notification = state.notifications.find(n => n.id === alertId);
        if (notification) {
          notification.is_read = true;
        }
        if (!state.seenAlertIds.includes(alertId)) {
          state.seenAlertIds.push(alertId);
        }
      });
    },

    /* ---------------- REMOVE ---------------- */
    removeReadNotifications: (state, action) => {
      const readIds = new Set(action.payload);
      state.notifications = state.notifications.filter(
        (n) => !readIds.has(n.id)
      );
    },

    /* ---------------- SETTINGS ---------------- */
    setAudioEnabled: (state, action) => {
      state.audioEnabled = action.payload;
    },

    setBootstrapped: (state, action) => {
      state.isBootstrapped = action.payload;
    },

    /* ---------------- CLEAR IDS ---------------- */
    clearSeenAlertIds: (state) => {
      state.seenAlertIds = [];
    },

    /* ---------------- RESET STATE ---------------- */
    resetNotificationState: () => ({
      ...initialState,
    }),

    /* ---------------- ERROR HANDLING ---------------- */
    setError: (state, action) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    /* ---------------- LOADING STATE ---------------- */
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    /* ---------------- CLEANUP HELPERS ---------------- */
    filterNotificationsByValidIds: (state, action) => {
      const validIds = new Set(action.payload);
      const before = state.notifications.length;
      state.notifications = state.notifications.filter((n) =>
        validIds.has(n.id)
      );
      if (
        process.env.NODE_ENV === 'development' &&
        before !== state.notifications.length
      ) {
        console.log(
          `Cleaned up ${before - state.notifications.length} stale notifications`
        );
      }
    },

    cleanupSeenAlertIds: (state, action) => {
      const validIds = new Set(action.payload);
      const before = state.seenAlertIds.length;
      state.seenAlertIds = state.seenAlertIds.filter((id) => validIds.has(id));
      if (
        process.env.NODE_ENV === 'development' &&
        before !== state.seenAlertIds.length
      ) {
        console.log(
          `Cleaned up ${before - state.seenAlertIds.length} stale seen alert IDs`
        );
      }
    },
  },
});

export const {
  addNotifications,
  clearNotifications,
  addSeenAlertId,
  addMultipleSeenAlertIds,
  markAlertAsRead,
  markMultipleAlertsAsRead,
  removeReadNotifications,
  setAudioEnabled,
  setBootstrapped,
  clearSeenAlertIds,
  resetNotificationState,
  setError,
  clearError,
  setLoading,
  filterNotificationsByValidIds,
  cleanupSeenAlertIds,
} = notificationSlice.actions;

/* ---------------------- SELECTORS ---------------------- */

export const selectNotifications = (state) => state.notifications.notifications;

export const selectUnreadCount = (state) => {
  return state.notifications.notifications.filter((notification) => 
    notification.is_read === false
  ).length;
};

export const selectUnreadNotifications = (state) => {
  return state.notifications.notifications.filter((notification) => 
    notification.is_read === false
  );
};

export const selectIsAlertRead = (alertId) => (state) => {
  const notification = state.notifications.notifications.find(n => n.id === alertId);
  return notification ? notification.is_read === true : false;
};

export const selectSeenAlertIds = (state) => state.notifications.seenAlertIds;
export const selectAudioEnabled = (state) => state.notifications.audioEnabled;
export const selectIsBootstrapped = (state) => state.notifications.isBootstrapped;
export const selectNotificationLoading = (state) => state.notifications.loading;
export const selectNotificationError = (state) => state.notifications.error;

export default notificationSlice.reducer;
