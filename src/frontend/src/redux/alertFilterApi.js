import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const alertFilterApi = createApi({
  reducerPath: "alertFilterApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/webuser/",
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Alert'],
  endpoints: (builder) => ({

    // Filtered alerts with proper parameter handling
    getFilteredAlerts: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        
        if (params.device_id) searchParams.append('device_id', params.device_id);
        if (params.severity) searchParams.append('severity', params.severity);
        if (params.alert_type) searchParams.append('alert_type', params.alert_type);
        if (params.time_range) searchParams.append('time_range', params.time_range);
        if (params.start_date) searchParams.append('start_date', params.start_date);
        if (params.end_date) searchParams.append('end_date', params.end_date);
        if (params.search_term) searchParams.append('search_term', params.search_term);
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.offset) searchParams.append('offset', params.offset.toString());
        
        const queryString = searchParams.toString();
        console.log('[Alert API] Final API URL:', `alerts/filtered/${queryString ? `?${queryString}` : ''}`);
        
        return `alerts/filtered/${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ["Alert"],
    }),

    // Get filter options for dropdowns
    getAlertFilterOptions: builder.query({
      query: (deviceId) => {
        return deviceId 
          ? `alerts/filter-options/?device_id=${deviceId}`
          : 'alerts/filter-options/';
      },
      providesTags: ['Alert'],
    }),

    // Mark single alert as read
    markAsRead: builder.mutation({
      query: (alertId) => ({
        url: 'alerts/mark-read/',
        method: 'PATCH',
        body: { alert_id: alertId },
      }),
      // Optimistic update for instant UI feedback
      async onQueryStarted(alertId, { dispatch, queryFulfilled, getState }) {
        // Optimistically update the notification slice
        dispatch({
          type: 'notifications/markAlertAsRead',
          payload: alertId,
        });

        try {
          await queryFulfilled;
          console.log(`Alert ${alertId} marked as read via API`);
        } catch (error) {
          console.error('Error marking alert as read:', error);
          // You could dispatch an undo action here if needed
        }
      },
      invalidatesTags: ['Alert'],
    }),

    // Mark all alerts as read
    markAllAsRead: builder.mutation({
      query: (alertIds) => ({
        url: 'alerts/mark-all-read/',
        method: 'PATCH',
        body: { alert_ids: alertIds },
      }),
      // Optimistic update for instant UI feedback
      async onQueryStarted(alertIds, { dispatch, queryFulfilled }) {
        // Optimistically update the notification slice
        dispatch({
          type: 'notifications/markMultipleAlertsAsRead',
          payload: alertIds,
        });

        try {
          await queryFulfilled;
          console.log(`${alertIds.length} alerts marked as read via API`);
        } catch (error) {
          console.error('Error marking all alerts as read:', error);
          // You could dispatch an undo action here if needed
        }
      },
      invalidatesTags: ['Alert'],
    }),
  }),
});

export const {
  useGetFilteredAlertsQuery,
  useGetAlertFilterOptionsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = alertFilterApi;
