import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const eventLogFilterApi = createApi({
  reducerPath: 'eventLogFilterApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/webuser/',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['EventLog'],
  endpoints: (builder) => ({

    // Filtered event logs with proper parameter handling
    getFilteredEventLogs: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        
        // Only add parameters that have values
        if (params.device_id) searchParams.append('device_id', params.device_id);
        if (params.event_type) searchParams.append('event_type', params.event_type);
        if (params.component_type) searchParams.append('component_type', params.component_type);
        if (params.time_range) searchParams.append('time_range', params.time_range);
        
        // ADD THESE TWO LINES FOR CUSTOM DATE RANGE SUPPORT
        if (params.start_date) searchParams.append('start_date', params.start_date);
        if (params.end_date) searchParams.append('end_date', params.end_date);
        
        if (params.search_term) searchParams.append('search_term', params.search_term);
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.offset) searchParams.append('offset', params.offset.toString());
        
        const queryString = searchParams.toString();
        
        // // 🔍 DEBUG: Log the final URL being called
        // console.log('[RTK Query] Final API URL:', `eventlogs/filtered/${queryString ? `?${queryString}` : ''}`);
        
        return `eventlogs/filtered/${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['EventLog'],
    }),

    // Get filter options for dropdowns
    getEventLogFilterOptions: builder.query({
      query: (deviceId) => {
        return deviceId 
          ? `eventlogs/filter-options/?device_id=${deviceId}`
          : 'eventlogs/filter-options/';
      },
      providesTags: ['EventLog'],
    }),

  }),
});

// Export hooks
export const { 
  useGetFilteredEventLogsQuery,
  useGetEventLogFilterOptionsQuery,
} = eventLogFilterApi;
