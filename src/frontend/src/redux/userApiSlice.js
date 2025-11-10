
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const userApiSlice = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/webuser' }),
  tagTypes: ['WebUser'],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => 'users/',
      providesTags: ['WebUser'],
    }),
    createUser: builder.mutation({
      query: (user) => ({
        url: 'signup/',
        method: 'POST',
        body: user,
      }),
      invalidatesTags: ['WebUser'],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...userData }) => ({
        url: `users/update/${id}/`,
        method: 'PATCH',  
        body: userData

      }),
      invalidatesTags: ['WebUser']
     
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `users/delete/${id}/`,
        method: 'DELETE'
      }),
      invalidatesTags: ['WebUser']
    }),

    updatePassword: builder.mutation({
  query: ({ id, newPassword }) => ({
    url: `/password-reset/${id}/`,
    method: 'PATCH',
    body: { newPassword },
  }),
  invalidatesTags: ['WebUser'],
}),
   
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUpdatePasswordMutation
} = userApiSlice;
