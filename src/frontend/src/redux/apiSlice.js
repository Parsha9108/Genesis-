import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// ✅ Enhanced custom base query to handle 404s, parsing errors, and provide better logging
const customBaseQuery = async (args, api, extraOptions) => {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl: '/api/webapp/v1',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      // Add any authentication headers if needed
      const token = getState()?.auth?.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      // ✅ UPDATED: Handle FormData (don't set Content-Type for file uploads)
      if (!headers.has('Content-Type') && !(args.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }
      
      return headers;
    },
    // ✅ Add timeout for requests
    timeout: 30000, // 30 seconds
  });
  
  // ✅ Enhanced error handling and logging
  try {
    console.log(`🌐 API Request: ${JSON.stringify(args)}`);
    const result = await rawBaseQuery(args, api, extraOptions);
    
    // Log successful requests
    if (result.data) {
      console.log(`✅ API Success: ${args.url || args}`, result.data);
    }
    
    // Handle 404s gracefully - treat as empty data
    if (result.error?.status === 404) {
      console.log('ℹ️ 404 detected, returning empty data for:', args);
      return { 
        data: {
          groups: [],
          total_groups: 0,
          total_devices: 0,
          user: null,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // Handle parsing errors gracefully
    if (result.error?.status === 'PARSING_ERROR') {
      console.warn('Parsing error detected, likely non-JSON response:', result.error);
      return { 
        data: {
          groups: [],
          total_groups: 0,
          total_devices: 0,
          user: null,
          timestamp: new Date().toISOString()
        }
      };
    }

    // ✅ Handle other common HTTP errors
    if (result.error?.status === 401) {
      console.warn('Unauthorized request - user may need to login');
    }

    if (result.error?.status === 500) {
      console.error('Server error:', result.error);
    }

    if (result.error?.status === 403) {
      console.warn('Forbidden request - insufficient permissions');
    }

    return result;
    
  } catch (networkError) {
    // Handle network errors
    console.error(' Network Error:', networkError);
    return {
      error: {
        status: 'FETCH_ERROR',
        error: 'Network error occurred',
        data: networkError.message
      }
    };
  }
};

export const apiSlice = createApi({
  reducerPath: 'api',
  tagTypes: ['Devices', 'Groups', 'CpuStats', 'MemoryStats', 'DiskStats'],
  baseQuery: customBaseQuery,
  
  // ✅ Enhanced performance optimizations
  keepUnusedDataFor: 300, // 5 minutes
  refetchOnMountOrArgChange: 30, // 30 seconds
  refetchOnFocus: true,
  refetchOnReconnect: true,

  endpoints: (builder) => ({
    // === DEVICE ENDPOINTS ===
    getDevices: builder.query({
      query: ({ page = 1, page_size = 10, search = '', os = '', device_type = '', status = '' }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: page_size.toString(),
        });
        
        if (search) params.append('search', search);
        if (os) params.append('os', os);
        if (device_type) params.append('device_type', device_type);
        if (status) params.append('status', status);
        
        return `devices?${params.toString()}`;
      },
      providesTags: (result) => 
        result?.results?.devices
          ? [
              ...result.results.devices.map(({ uuid }) => ({ type: 'Devices', id: uuid })),
              { type: 'Devices', id: 'LIST' },
            ]
          : [{ type: 'Devices', id: 'LIST' }],
      transformResponse: (response) => {
        // Transform to consistent structure
        return {
          devices: response.results?.devices || [],
          count: response.count || 0,
          next: response.next,
          previous: response.previous,
        };
      },
      transformErrorResponse: (response) => ({
        status: response.status,
        error: response.data?.error || 'Failed to fetch devices',
        message: response.data?.message || 'Unable to load device data',
      }),
      keepUnusedDataFor: 60,
    }),

    getDevicesdata: builder.query({
      query: () => 'devicedata',
      providesTags: ['Devices'],
      keepUnusedDataFor: 600,
      // ✅ Add error handling for device queries
      transformErrorResponse: (response) => ({
        status: response.status,
        error: response.data?.error || 'Failed to fetch devices',
        message: response.data?.message || 'Unable to load device data',
      }),
    }),

    getAvailableDevicesdata: builder.query({
      query: () => 'available_devices',
      providesTags: ['Devices'],
      keepUnusedDataFor: 600,
      // ✅ Add error handling for device queries
      transformErrorResponse: (response) => ({
        status: response.status,
        error: response.data?.error || 'Failed to fetch devices',
        message: response.data?.message || 'Unable to load device data',
      }),
    }),

    getDeviceDetailsById: builder.query({
      query: (uuid) => `device/${uuid}`,
      providesTags: (result, error, uuid) => [
        { type: 'Devices', id: uuid },
        { type: 'Devices', id: 'DETAIL' }
      ],
      transformErrorResponse: (response) => ({
        status: response.status,
        error: response.data?.error || 'Failed to fetch device details',
        message: response.data?.message || 'Unable to load device information',
      }),
    }),

     // NEW: Device CSV Import endpoint
  importDevicesFromCSV: builder.mutation({
  query: ({ csvFile, groupName }) => {
    const formData = new FormData();
    formData.append('csv_file', csvFile);
    if (groupName) {
      formData.append('group_name', groupName);
    }

    return {
      url: 'validate-csv/',
      method: 'POST',
      body: formData,
      credentials: 'include', 
    };
  },
  invalidatesTags: ['Devices'],
  transformResponse: (response) => ({
    ...response,
    importedAt: new Date().toISOString(),
    devices: response.devices?.map((device) => ({
      ...device,
      imported_at: device.imported_at ? new Date(device.imported_at) : new Date(),
      updated_at: device.updated_at ? new Date(device.updated_at) : new Date(),
    })) || [],
  }),
  transformErrorResponse: (response) => ({
    status: response.status,
    error: response.data?.error || 'Failed to import CSV',
    message: response.data?.message || 'Unable to process CSV file',
  }),
}),

    // // Assign devices to group
    // assignDevicesToGroup: builder.mutation({
    //   query: ({ groupId, deviceIds }) => ({
    //     url: '../devices/assign-to-group/', 
    //     method: 'POST',
    //     body: {
    //       group_id: groupId,
    //       device_ids: deviceIds,
    //     },
    //   }),
    //   invalidatesTags: ['Devices', 'Groups'],
    //   transformErrorResponse: (response) => ({
    //     status: response.status,
    //     error: response.data?.error || 'Failed to assign devices',
    //     message: response.data?.message || 'Unable to assign devices to group',
    //   }),
    // }),

    // // === GROUP ENDPOINTS ===
    // // ✅ Enhanced GET method for all groups with better caching control
    // getAllGroups: builder.query({
    //   query: () => 'get_groups/',
    //   providesTags: ['Groups'],
    //   keepUnusedDataFor: 300,
    //   transformResponse: (response) => {
    //     console.log('Fetched groups from API:', response);
    //     return {
    //       success: true,
    //       groups: response.groups || response,
    //       totalGroups: response.total_groups || response.groups?.length || response.length || 0,
    //       data: response
    //     };
    //   },
    //   transformErrorResponse: (response) => ({
    //     status: response.status,
    //     error: response.data?.error || 'Failed to fetch groups',
    //     message: response.data?.message || 'Unable to load group configuration',
    //   }),
    // }),

    // // ✅ Enhanced DELETE method for groups
    // deleteGroup: builder.mutation({
    //   query: (groupId) => ({
    //     url: `delete_group/${groupId}/`,
    //     method: 'DELETE',
    //   }),
    //   // ✅ CRITICAL: Use manual cache update instead of invalidation to work with local changes
    //   async onQueryStarted(groupId, { dispatch, queryFulfilled }) {
    //     // ✅ Optimistic update - remove group from cache immediately
    //     const patchResult = dispatch(
    //       apiSlice.util.updateQueryData('getAllGroups', undefined, (draft) => {
    //         if (draft.groups) {
    //           draft.groups = draft.groups.filter(group => group.group_id !== groupId);
    //           draft.totalGroups = (draft.totalGroups || 0) - 1;
    //         }
    //       })
    //     );

    //     try {
    //       await queryFulfilled;
    //       console.log(`✅ Group ${groupId} deleted successfully`);
    //     } catch {
    //       // ✅ Revert optimistic update on failure
    //       patchResult.undo();
    //     }
    //   },
    //   transformResponse: (response) => ({
    //     success: true,
    //     message: response.message || 'Group deleted successfully',
    //     data: response,
    //     deletedAt: new Date().toISOString(),
    //   }),
    //   transformErrorResponse: (response) => ({
    //     status: response.status,
    //     error: response.data?.error || 'Failed to delete group',
    //     message: response.data?.message || 'An error occurred while deleting the group',
    //   }),
    // }),

    // // ✅ SIMPLIFIED: Enhanced POST method for saving groups (removed priority handling)
    // saveGroupConfiguration: builder.mutation({
    //   query: (groupData) => {
    //     console.log('🚀 Sending simplified group configuration to API:', groupData);
    //     return {
    //       url: 'groups/configuration/',
    //       method: 'POST',
    //       body: groupData,
    //     };
    //   },
    //   // ✅ CRITICAL: Manual cache update to work with local changes management
    //   async onQueryStarted(groupData, { dispatch, queryFulfilled }) {
    //     try {
    //       const { data } = await queryFulfilled;
          
    //       // ✅ Update the getAllGroups cache with the saved data
    //       dispatch(
    //         apiSlice.util.updateQueryData('getAllGroups', undefined, (draft) => {
    //           // Update the cache with the saved data
    //           if (data && data.groups) {
    //             draft.groups = data.groups;
    //             draft.totalGroups = data.total_groups || data.groups.length;
    //             draft.data = data;
    //           } else if (groupData && groupData.groups) {
    //             // ✅ SIMPLIFIED: Fallback to using the simplified request data
    //             draft.groups = groupData.groups;
    //             draft.totalGroups = groupData.total_groups || groupData.groups.length;
    //           }
    //         })
    //       );
          
    //       console.log('✅ Simplified groups cache updated after save');
    //     } catch (error) {
    //       console.error('❌ Failed to update cache after save:', error);
    //     }
    //   },
    //   transformResponse: (response, meta, arg) => {
    //     console.log('✅ Save response from API:', response);
    //     return {
    //       success: true,
    //       message: response.message || 'Group configuration saved successfully',
    //       data: response.data || response,
    //       totalGroups: response.total_groups || arg.groups?.length || 0,
    //       totalDevices: response.total_devices || 0,
    //       savedAt: response.savedAt || new Date().toISOString(),
    //     };
    //   },
    //   transformErrorResponse: (response) => ({
    //     status: response.status,
    //     error: response.data?.error || 'Failed to save group configuration',
    //     message: response.data?.message || 'An error occurred while saving the configuration',
    //   }),
    // }),

    // === CPU STATS ENDPOINTS ===
    // ✅ NEW: Added CPU minutely stats endpoint
    getCpuMinutelyStats: builder.query({
      query: (uuid) => `cpu/${uuid}/stats/minutely/`,
      providesTags: (result, error, uuid) => [
        { type: 'CpuStats', id: uuid },
        { type: 'CpuStats', id: 'MINUTELY' }
      ],
      retry: (failureCount, error) => {
        return failureCount < 3 && error.status >= 500;
      },
      keepUnusedDataFor: 60, // Keep minutely data for 1 minute only
      refetchOnMountOrArgChange: true,
    }),

    getCpuHourlyStats: builder.query({
      query: (uuid) => `cpu/${uuid}/stats/hourly/`,
      providesTags: (result, error, uuid) => [
        { type: 'CpuStats', id: uuid },
        { type: 'CpuStats', id: 'HOURLY' }
      ],
      retry: (failureCount, error) => {
        return failureCount < 3 && error.status >= 500;
      },
    }),

    getCpuDailyStats: builder.query({
      query: (uuid) => `cpu/${uuid}/stats/daily/`,
      providesTags: (result, error, uuid) => [
        { type: 'CpuStats', id: uuid },
        { type: 'CpuStats', id: 'DAILY' }
      ],
      retry: (failureCount, error) => {
        return failureCount < 3 && error.status >= 500;
      },
    }),

    getCpuWeeklyStats: builder.query({
      query: (uuid) => `cpu/${uuid}/stats/weekly/`,
      providesTags: (result, error, uuid) => [
        { type: 'CpuStats', id: uuid },
        { type: 'CpuStats', id: 'WEEKLY' }
      ],
      retry: (failureCount, error) => {
        return failureCount < 3 && error.status >= 500;
      },
    }),

    getCpuMonthlyStats: builder.query({
      query: (uuid) => `cpu/${uuid}/stats/monthly/`,
      providesTags: (result, error, uuid) => [
        { type: 'CpuStats', id: uuid },
        { type: 'CpuStats', id: 'MONTHLY' }
      ],
      retry: (failureCount, error) => {
        return failureCount < 3 && error.status >= 500;
      },
    }),

    getCpuCustomRangeStats: builder.mutation({
      query: ({ uuid, start_date, end_date, granularity = 'daily' }) => ({
        url: `cpu/${uuid}/stats/custom-range/`,
        method: 'POST',
        body: { start_date, end_date, granularity },
      }),
      invalidatesTags: (result, error, { uuid }) => [
        { type: 'CpuStats', id: uuid },
      ],
    }),

    // === MEMORY STATS ENDPOINTS ===
    // ✅ NEW: Added Memory minutely stats endpoint
    getMemoryMinutelyStats: builder.query({
      query: (agentUuid) => `memory/${agentUuid}/stats/minutely/`,
      providesTags: (result, error, agentUuid) => [
        { type: 'MemoryStats', id: agentUuid },
        { type: 'MemoryStats', id: 'MINUTELY' }
      ],
      retry: (failureCount, error) => {
        return failureCount < 3 && error.status >= 500;
      },
      keepUnusedDataFor: 60,
      refetchOnMountOrArgChange: true,
    }),

    getMemoryHourlyStats: builder.query({
      query: (agentUuid) => `memory/${agentUuid}/stats/hourly/`,
      providesTags: (result, error, agentUuid) => [
        { type: 'MemoryStats', id: agentUuid },
        { type: 'MemoryStats', id: 'HOURLY' }
      ],
      retry: (failureCount, error) => {
        return failureCount < 3 && error.status >= 500;
      },
    }),
    
    getMemoryDailyStats: builder.query({
      query: (agentUuid) => `memory/${agentUuid}/stats/daily/`,
      providesTags: (result, error, agentUuid) => [
        { type: 'MemoryStats', id: agentUuid },
        { type: 'MemoryStats', id: 'DAILY' }
      ],
      retry: (failureCount, error) => {
        return failureCount < 3 && error.status >= 500;
      },
    }),
    
    getMemoryWeeklyStats: builder.query({
      query: (agentUuid) => `memory/${agentUuid}/stats/weekly/`,
      providesTags: (result, error, agentUuid) => [
        { type: 'MemoryStats', id: agentUuid },
        { type: 'MemoryStats', id: 'WEEKLY' }
      ],
      retry: (failureCount, error) => {
        return failureCount < 3 && error.status >= 500;
      },
    }),
    
    getMemoryMonthlyStats: builder.query({
      query: (agentUuid) => `memory/${agentUuid}/stats/monthly/`,
      providesTags: (result, error, agentUuid) => [
        { type: 'MemoryStats', id: agentUuid },
        { type: 'MemoryStats', id: 'MONTHLY' }
      ],
      retry: (failureCount, error) => {
        return failureCount < 3 && error.status >= 500;
      },
    }),
    
    getMemoryCustomRangeStats: builder.mutation({
      query: ({ uuid, start_date, end_date, granularity = 'daily' }) => ({
        url: `memory/${uuid}/stats/custom-range/`,
        method: 'POST',
        body: { start_date, end_date, granularity },
      }),
      invalidatesTags: (result, error, { uuid }) => [
        { type: 'MemoryStats', id: uuid },
      ],
    }),

    // === DISK STATS ENDPOINTS ===
    // ✅ NEW: Added Disk minutely stats endpoint
    getDiskMinutelyStats: builder.query({
      query: (uuid) => `disk/${uuid}/stats/minutely/`,
      providesTags: (result, error, uuid) => [
        { type: 'DiskStats', id: uuid },
        { type: 'DiskStats', id: 'MINUTELY' }
      ],
      retry: (failureCount, error) => {
        return failureCount < 3 && error.status >= 500;
      },
      keepUnusedDataFor: 60, // Keep minutely data for 1 minute only
      refetchOnMountOrArgChange: true,
    }),

    getDiskHourlyStats: builder.query({
      query: (uuid) => `disk/${uuid}/stats/hourly/`,
      providesTags: (result, error, uuid) => [
        { type: 'DiskStats', id: uuid },
        { type: 'DiskStats', id: 'HOURLY' }
      ],
      retry: (failureCount, error) => {
        return failureCount < 3 && error.status >= 500;
      },
    }),
    
    getDiskDailyStats: builder.query({
      query: (uuid) => `disk/${uuid}/stats/daily/`,
      providesTags: (result, error, uuid) => [
        { type: 'DiskStats', id: uuid },
        { type: 'DiskStats', id: 'DAILY' }
      ],
      retry: (failureCount, error) => {
        return failureCount < 3 && error.status >= 500;
      },
    }),
    
    getDiskWeeklyStats: builder.query({
      query: (uuid) => `disk/${uuid}/stats/weekly/`,
      providesTags: (result, error, uuid) => [
        { type: 'DiskStats', id: uuid },
        { type: 'DiskStats', id: 'WEEKLY' }
      ],
      retry: (failureCount, error) => {
        return failureCount < 3 && error.status >= 500;
      },
    }),
    
    getDiskMonthlyStats: builder.query({
      query: (uuid) => `disk/${uuid}/stats/monthly/`,
      providesTags: (result, error, uuid) => [
        { type: 'DiskStats', id: uuid },
        { type: 'DiskStats', id: 'MONTHLY' }
      ],
      retry: (failureCount, error) => {
        return failureCount < 3 && error.status >= 500;
      },
    }),
    
    getDiskCustomRangeStats: builder.mutation({
      query: ({ uuid, start_date, end_date, granularity = 'daily' }) => ({
        url: `disk/${uuid}/stats/custom-range/`,
        method: 'POST',
        body: { start_date, end_date, granularity },
      }),
      invalidatesTags: (result, error, { uuid }) => [
        { type: 'DiskStats', id: uuid },
      ],
    }),
  }),
});

// Export hooks including the NEW device hooks
export const {
  // Device hooks
  useGetDevicesQuery,
  useGetDevicesdataQuery,
  useGetDeviceDetailsByIdQuery,
  useGetAvailableDevicesdataQuery,
  
  // Device management hooks
  useImportDevicesFromCSVMutation,
  // useAssignDevicesToGroupMutation,
  
  // Group hooks
  // useGetAllGroupsQuery,
  // useDeleteGroupMutation,
  // useSaveGroupConfigurationMutation,
  
  // CPU hooks
  useGetCpuMinutelyStatsQuery,  
  useGetCpuHourlyStatsQuery,
  useGetCpuDailyStatsQuery,
  useGetCpuWeeklyStatsQuery,
  useGetCpuMonthlyStatsQuery,
  useGetCpuCustomRangeStatsMutation,
  
  // Memory hooks
  useGetMemoryMinutelyStatsQuery, 
  useGetMemoryHourlyStatsQuery,
  useGetMemoryDailyStatsQuery,
  useGetMemoryWeeklyStatsQuery,
  useGetMemoryMonthlyStatsQuery,
  useGetMemoryCustomRangeStatsMutation,
  
  // Disk hooks
  useGetDiskMinutelyStatsQuery,   
  useGetDiskHourlyStatsQuery,
  useGetDiskDailyStatsQuery,
  useGetDiskWeeklyStatsQuery,
  useGetDiskMonthlyStatsQuery,
  useGetDiskCustomRangeStatsMutation,
  
} = apiSlice;

// Export utility functions for manual cache management
export const {
  updateQueryData,
  invalidateTags,
  resetApiState
} = apiSlice.util;
