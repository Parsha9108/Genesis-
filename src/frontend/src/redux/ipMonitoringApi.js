import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const ipMonitoringApi = createApi({
  reducerPath: 'ipMonitoringApi',

  baseQuery: fetchBaseQuery({
    baseUrl: '/api/webapp/v1/',
    prepareHeaders: (headers, { getState }) => {
      const token =
        getState()?.auth?.token || localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),

  tagTypes: ['IPAddress'],

  endpoints: (builder) => ({
    /* ================================
       GET – List all IPs (with pagination)
    ================================= */
    getIPAddresses: builder.query({
      query: (params = {}) => {
        const { page = 1, page_size = 10, search } = params;
        
        // Build query string
        const queryParams = new URLSearchParams();
        queryParams.append('page', page);
        queryParams.append('page_size', page_size);
        
        // Only add search if it exists
        if (search) {
          queryParams.append('search', search);
        }
        
        return `/ip-monitoring/?${queryParams.toString()}`;
      },
      // Transform the response to match your component's expectations
      transformResponse: (response) => {
        console.log('Raw API Response:', response);
        
        // Handle paginated response
        if (response.results) {
          return {
            data: response.results.map(ip => ({
              ...ip,
              id: ip.uuid, // Map uuid to id
            })),
            count: response.count,
            next: response.next,
            previous: response.previous,
          };
        }
        
        // Handle non-paginated response (fallback)
        return {
          data: response.map(ip => ({
            ...ip,
            id: ip.uuid,
          })),
          count: response.length,
        };
      },
      providesTags: (result) =>
        result?.data
          ? [
            ...result.data.map(({ id }) => ({
              type: 'IPAddress',
              id,
            })),
            { type: 'IPAddress', id: 'LIST' },
          ]
          : [{ type: 'IPAddress', id: 'LIST' }],
    }),

    /* ================================
       GET – Single IP
    ================================= */
    getIPAddressById: builder.query({
      query: (id) => `/ip-monitoring/${id}/`,
      providesTags: (result, error, id) => [
        { type: 'IPAddress', id },
      ],
    }),

    /* ================================
       POST – Create IP
    ================================= */
    createIPAddress: builder.mutation({
      query: (payload) => ({
        url: '/ip-monitoring/',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [{ type: 'IPAddress', id: 'LIST' }],
    }),

    /* ================================
       POST – CSV Bulk Upload
    ================================= */
    bulkUploadIPs: builder.mutation({
      query: (formData) => {
        return {
          url: '/ip-monitoring/',
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: [{ type: 'IPAddress', id: 'LIST' }],
    }),

    /* ================================
       PATCH – Single + Bulk Update
       payload:
       - object  → single update
       - array   → bulk update
    ================================= */
    updateIPs: builder.mutation({
      query: (payload) => ({
        url: '/ip-monitoring/',
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: [{ type: 'IPAddress', id: 'LIST' }],
    }),

    /* ================================
       DELETE – Single + Bulk Delete
       payload:
       - object  → single delete
       - array   → bulk delete
    ================================= */
    deleteIPs: builder.mutation({
      query: (payload) => ({
        url: '/ip-monitoring/',
        method: 'DELETE',
        body: payload,
      }),
      invalidatesTags: [{ type: 'IPAddress', id: 'LIST' }],
    }),
  }),
});

/* ================================
   Export Hooks
================================= */
export const {
  useGetIPAddressesQuery,
  useGetIPAddressByIdQuery,
  useCreateIPAddressMutation,
  useBulkUploadIPsMutation,
  useUpdateIPsMutation,
  useDeleteIPsMutation,
} = ipMonitoringApi;
