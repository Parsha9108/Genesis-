// // redux/devicesApiSlice.js
// import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// // Create a separate API slice for devices
// export const devicesApiSlice = createApi({
//   reducerPath: 'devicesApi',
//   baseQuery: fetchBaseQuery({
//     baseUrl: '/api/webuser/',
//     credentials: 'include',
//     prepareHeaders: (headers, { getState }) => {
//       headers.set('Content-Type', 'application/json');
//       return headers;
//     },
//   }),
//   tagTypes: ['Device'],
//   endpoints: (builder) => ({
//     // Get all devices - GET /devicedata/
//     getDevicedata: builder.query({
//       query: () => 'devicedata/',
//       providesTags: ['Device'],
//       transformResponse: (response) => {
//         console.log('getDevicedata API response:', response);
//         return response;
//       },
//       transformErrorResponse: (response) => {
//         console.error('getDevicedata API error:', response);
//         return response;
//       },
//     }),

//     // Get device by UUID - GET /device/<uuid>/
//     getDeviceByUuid: builder.query({
//       query: (uuid) => `device/${uuid}/`,
//       providesTags: (result, error, uuid) => [{ type: 'Device', id: uuid }],
//       transformResponse: (response) => {
//         console.log('getDeviceByUuid API response:', response);
//         return response;
//       },
//       transformErrorResponse: (response) => {
//         console.error('getDeviceByUuid API error:', response);
//         return response;
//       },
//     }),
//   }),
// });

// // Export hooks for usage in components
// export const {
//   useGetDevicedataQuery,
//   useGetDeviceByUuidQuery,
// } = devicesApiSlice;

// export default devicesApiSlice;
