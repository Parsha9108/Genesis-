// src/redux/devicesApiSlice.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const devicesApi = createApi({
  reducerPath: 'devicesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/webapp/v1/',
    credentials: 'include',
  }),
  tagTypes: ['Device'],
  endpoints: (builder) => ({
    // Get devices list with pagination and search
    getDevices: builder.query({
      query: ({ page = 1, page_size = 10, search = '' }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('page_size', page_size.toString());
        if (search) params.append('search', search);
        return `devicedata?${params.toString()}`;
      },
      providesTags: (result) => {
        const devicesList = result?.results || [];
        return Array.isArray(devicesList)
          ? [
              ...devicesList.map(({ uuid }) => ({ type: 'Device', id: uuid })),
              { type: 'Device', id: 'LIST' },
            ]
          : [{ type: 'Device', id: 'LIST' }];
      },
      transformErrorResponse: (response) => ({
        status: response.status,
        error: response.data?.error || 'Failed to fetch devices',
        message: response.data?.message || 'Unable to load device data',
      }),
      keepUnusedDataFor: 60,
    }),

    // Get single device by UUID
    getDeviceById: builder.query({
      query: (uuid) => `device/${uuid}`,
      providesTags: (result, error, uuid) => [{ type: 'Device', id: uuid }],
      transformErrorResponse: (response) => ({
        status: response.status,
        error: response.data?.error || 'Failed to fetch device details',
        message: response.data?.message || 'Unable to load device information',
      }),
    }),

    deleteDevice: builder.mutation({
      query: ({ uuid, uuids }) => ({
        url: `delete_agent/`, 
        method: 'DELETE',
        body: uuids ? { uuids } : { uuid }, 
      }),
      invalidatesTags: (result, error, { uuid, uuids }) => {
        // If single delete
        if (uuid) {
          return [
            { type: 'Device', id: uuid },
            { type: 'Device', id: 'LIST' },
          ];
        }
        // If bulk delete
        if (uuids) {
          return [
            ...uuids.map(id => ({ type: 'Device', id })),
            { type: 'Device', id: 'LIST' },
          ];
        }
        return [{ type: 'Device', id: 'LIST' }];
      },
    }),

  }),
});

export const {
  useGetDevicesQuery,
  useGetDeviceByIdQuery,
  useDeleteDeviceMutation,
} = devicesApi;
