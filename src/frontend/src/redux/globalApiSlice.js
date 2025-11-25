import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const globalApiSlice = createApi({
  reducerPath: 'globalApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/webuser/',
    credentials: 'include',
  }),
  tagTypes: ['GLOBALConfig'],
  endpoints: (builder) => ({
    // GET request to fetch SMTP configuration
    getGlobalConfig: builder.query({
      query: () => ({
        url: '/globalconfig',
        method: 'GET',
      }),
      providesTags: ['GLOBALConfig'],
    }),
    
    // PATCH request to save SMTP configuration
    saveGlobalConfig: builder.mutation({
      query: (payload) => ({
        url: '/globalconfig',
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ['GLOBALConfig'], 
    }),
     // POST request to TEST configuration
    testGlobalConfig: builder.mutation({
      query: (payload) => ({
        url: '/test-smtp-config/',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['GLOBALConfig'], 
    }),
  }),
});

export const { 
  useGetGlobalConfigQuery, 
  useSaveGlobalConfigMutation,
  useTestGlobalConfigMutation
} = globalApiSlice;
