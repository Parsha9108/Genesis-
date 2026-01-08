import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const alertFilterApi = createApi({
  reducerPath: 'alertSlice',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/webapp/v1',
    prepareHeaders: (headers, { getState }) => {
      const token =
        getState()?.auth?.token || localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Alerts', 'AlertFilters'],
  endpoints: (builder) => ({
    getAlerts: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        
        if (params.device_id) {
          queryParams.append('uuid', params.device_id);
        }
        
        if (params.alert_type) {
          queryParams.append('alert_type', params.alert_type);
        }
        
        if (params.severity) {
          queryParams.append('severity', params.severity);
        }
        
        if (params.start_date) {
          queryParams.append('start_date', params.start_date);
        }
        
        if (params.end_date) {
          queryParams.append('end_date', params.end_date);
        }
        
        if (params.is_read !== undefined) {
          queryParams.append('is_read', params.is_read);
        }
        
        const queryString = queryParams.toString();
        return `get_alerts${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['Alerts'],
    }),

    getAlertFilterOptions: builder.query({
      query: (deviceUuid) => ({
        url: 'get_alert_filter_options/',
        params: {
          uuid: deviceUuid
        }
      }),
      providesTags: (result, error, deviceUuid) => [
        { type: 'AlertFilters', id: deviceUuid }
      ],
    }),

    // Mark single alert as read
    markAlertAsRead: builder.mutation({
      query: (alertId) => ({
        url: `alerts/mark_read/`,
        body: { uuid: alertId },
        method: 'POST',
      }),
      invalidatesTags: ['Alerts'],
    }),

    // Unread counts
    unreadCounts: builder.query({
      query: (deviceId) => ({
        url: 'alerts/unread_count/',
        params: { uuid: deviceId },
      }),
      providesTags: ['Alerts'],
    }),

    // Mark all alerts as read for a devic
    markAllAlertsAsRead: builder.mutation({
      query: (deviceUuid) => ({
        url: 'alerts/mark_all_read/',
        method: 'POST',
        body: { 
          device_uuid: deviceUuid 
        },
      }),
      invalidatesTags: ['Alerts'],
    }),
  }),
});

export const {
  useGetAlertsQuery,
  useGetAlertFilterOptionsQuery,
  useMarkAlertAsReadMutation,
  useMarkAllAlertsAsReadMutation,
  useUnreadCountsQuery,
} = alertFilterApi;

export default alertFilterApi;
