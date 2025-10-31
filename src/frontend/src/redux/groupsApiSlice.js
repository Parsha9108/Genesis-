import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Create a separate API slice for groups
export const groupsApiSlice = createApi({
  reducerPath: 'groupsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/webuser/',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      // Same JWT token logic as your working main apiSlice
      let token = null;
      
      // 1. Try Redux state first
      token = getState()?.auth?.token;
      
      // 2. If no token in Redux, check the actual 'jwt' cookie (your cookie name)
      if (!token) {
        const getCookieValue = (name) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop().split(';').shift();
          return null;
        };
        
        // ✅ Check for your actual cookie name 'jwt' first
        token = getCookieValue('jwt');
      }
      
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
        console.log('✅ JWT Token added to groups API request');
      } else {
        console.warn('⚠️ No JWT token found for groups API request');
        console.log('🍪 Available cookies:', document.cookie);
      }
      
      // Set content type headers
      headers.set('Content-Type', 'application/json');
      headers.set('Accept', 'application/json');
      
      return headers;
    },
  }),
  tagTypes: ['UserGroup', 'GroupDevice'],
  endpoints: (builder) => ({
    // Get all user groups - GET /get_groups/
    getUserGroups: builder.query({
      query: () => 'get_groups/',
      providesTags: ['UserGroup'],
      transformResponse: (response) => {
        console.log('✅ getUserGroups API response:', response);
        
        // Handle different response formats
        if (response && typeof response === 'object') {
          // If response has groups array
          if (response.groups && Array.isArray(response.groups)) {
            return response;
          }
          // If response IS the groups array
          if (Array.isArray(response)) {
            return { groups: response };
          }
          // If response has data.groups
          if (response.data && response.data.groups && Array.isArray(response.data.groups)) {
            return response.data;
          }
        }
        
        // Fallback - return empty groups
        console.warn('Unexpected response format, returning empty groups:', response);
        return { groups: [] };
      },
      transformErrorResponse: (response) => {
        console.error('❌ getUserGroups API error:', response);
        
        // Handle authentication errors specifically
        if (response.originalStatus === 401) {
          return {
            status: 401,
            message: 'Authentication required - JWT token is missing or expired.',
            details: 'Please check if JWT token is properly stored.',
          };
        }
        
        if (response.originalStatus === 403) {
          return {
            status: 403,
            message: 'Access forbidden - JWT token is invalid or insufficient permissions.',
            details: 'The JWT token does not provide sufficient access.',
          };
        }
        
        // Handle parsing errors
        if (response.status === 'PARSING_ERROR') {
          return {
            status: response.originalStatus || 500,
            message: `Django backend error: The get_groups endpoint is returning HTML instead of JSON (Status: ${response.originalStatus}).`,
            details: 'Check Django URL patterns and view implementation.',
          };
        }
        
        return {
          status: response.originalStatus || 'UNKNOWN',
          message: response.message || 'Unknown error occurred',
          details: response.details || 'No additional details available'
        };
      },
    }),

    // Save user groups - POST /groups/configuration/
    saveUserGroups: builder.mutation({
      query: (payload) => {
        console.log('🚀 Sending group configuration to groups API:', payload);
        return {
          url: 'groups/configuration/',
          method: 'POST',
          body: payload,
        };
      },
      invalidatesTags: ['UserGroup'],
      transformResponse: (response) => {
        console.log('✅ saveUserGroups API response:', response);
        return {
          success: true,
          message: response.message || 'Groups saved successfully',
          data: response,
          savedAt: new Date().toISOString(),
        };
      },
      transformErrorResponse: (response) => {
        console.error('❌ saveUserGroups API error:', response);
        
        // Handle authentication errors
        if (response.originalStatus === 401) {
          return {
            status: 401,
            message: 'Authentication required to save groups - JWT token is missing or expired.',
            details: 'Cannot save groups without valid authentication.',
          };
        }
        
        if (response.originalStatus === 403) {
          return {
            status: 403,
            message: 'Insufficient permissions to save groups - JWT token is invalid.',
            details: 'The current user does not have permission to save groups.',
          };
        }
        
        if (response.status === 'PARSING_ERROR') {
          return {
            status: response.originalStatus || 500,
            message: `Unable to save groups: Django backend error (Status: ${response.originalStatus}).`,
            details: 'The groups/configuration/ endpoint is returning HTML instead of JSON.',
            suggestions: [
              'Check Django URL pattern for "groups/configuration/"',
              'Verify save_user_groups_view exists and returns JsonResponse',
              'Check Django logs for errors'
            ]
          };
        }
        
        return {
          status: response.originalStatus || 'UNKNOWN',
          message: response.data?.error || response.message || 'Failed to save groups',
          details: response.data?.details || 'Unknown error occurred'
        };
      },
    }),

    // Delete user group - DELETE /delete_group/<group_id>/
    deleteUserGroup: builder.mutation({
      query: (groupId) => {
        console.log('🗑️ Deleting group via groups API:', groupId);
        return {
          url: `delete_group/${groupId}/`,
          method: 'DELETE',
        };
      },
      invalidatesTags: ['UserGroup'],
      transformResponse: (response) => {
        console.log('✅ deleteUserGroup API response:', response);
        return {
          success: true,
          message: response.message || 'Group deleted successfully',
          data: response,
          deletedAt: new Date().toISOString(),
        };
      },
      transformErrorResponse: (response) => {
        console.error('❌ deleteUserGroup API error:', response);
        
        // Handle authentication errors
        if (response.originalStatus === 401) {
          return {
            status: 401,
            message: 'Authentication required to delete group - JWT token is missing or expired.',
            details: 'Cannot delete group without valid authentication.',
          };
        }
        
        if (response.originalStatus === 403) {
          return {
            status: 403,
            message: 'Insufficient permissions to delete group - JWT token is invalid.',
            details: 'The current user does not have permission to delete groups.',
          };
        }
        
        if (response.status === 'PARSING_ERROR') {
          return {
            status: response.originalStatus || 500,
            message: `Unable to delete group: Django backend error (Status: ${response.originalStatus}).`,
            details: 'The delete_group/<group_id>/ endpoint is returning HTML instead of JSON.',
          };
        }
        
        return {
          status: response.originalStatus || 'UNKNOWN',
          message: response.data?.error || response.message || 'Failed to delete group',
          details: response.data?.details || 'Unknown error occurred'
        };
      },
    }),

    // Add devices to group (using save endpoint with operation flag)
    addDevicesToGroup: builder.mutation({
      query: (payload) => {
        console.log('➕ Adding devices to group via groups API:', payload);
        return {
          url: 'groups/configuration/',
          method: 'POST',
          body: {
            ...payload,
            operation: 'add_devices'
          },
        };
      },
      invalidatesTags: ['UserGroup', 'GroupDevice'],
      transformResponse: (response) => {
        console.log('✅ addDevicesToGroup API response:', response);
        return {
          success: true,
          message: response.message || 'Devices added successfully',
          data: response,
          addedAt: new Date().toISOString(),
        };
      },
      transformErrorResponse: (response) => {
        console.error('❌ addDevicesToGroup API error:', response);
        return {
          status: response.originalStatus || 'UNKNOWN',
          message: response.data?.error || response.message || 'Failed to add devices',
          details: response.data?.details || 'Unknown error occurred'
        };
      },
    }),

    // Remove device from group (using save endpoint with operation flag)
    removeDeviceFromGroup: builder.mutation({
      query: (payload) => {
        console.log('➖ Removing device from group via groups API:', payload);
        return {
          url: 'groups/configuration/',
          method: 'POST',
          body: {
            ...payload,
            operation: 'remove_device'
          },
        };
      },
      invalidatesTags: ['UserGroup', 'GroupDevice'],
      transformResponse: (response) => {
        console.log('✅ removeDeviceFromGroup API response:', response);
        return {
          success: true,
          message: response.message || 'Device removed successfully',
          data: response,
          removedAt: new Date().toISOString(),
        };
      },
      transformErrorResponse: (response) => {
        console.error('❌ removeDeviceFromGroup API error:', response);
        return {
          status: response.originalStatus || 'UNKNOWN',
          message: response.data?.error || response.message || 'Failed to remove device',
          details: response.data?.details || 'Unknown error occurred'
        };
      },
    }),

    // Update group details
    updateGroupDetails: builder.mutation({
      query: (payload) => {
        console.log('✏️ Updating group details via groups API:', payload);
        return {
          url: 'groups/configuration/',
          method: 'POST',
          body: {
            ...payload,
            operation: 'update_group'
          },
        };
      },
      invalidatesTags: ['UserGroup'],
      transformResponse: (response) => {
        console.log('✅ updateGroupDetails API response:', response);
        return {
          success: true,
          message: response.message || 'Group updated successfully',
          data: response,
          updatedAt: new Date().toISOString(),
        };
      },
      transformErrorResponse: (response) => {
        console.error('❌ updateGroupDetails API error:', response);
        return {
          status: response.originalStatus || 'UNKNOWN',
          message: response.data?.error || response.message || 'Failed to update group',
          details: response.data?.details || 'Unknown error occurred'
        };
      },
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetUserGroupsQuery,
  useSaveUserGroupsMutation,
  useDeleteUserGroupMutation,
  useAddDevicesToGroupMutation,
  useRemoveDeviceFromGroupMutation,
  useUpdateGroupDetailsMutation,
} = groupsApiSlice;

export default groupsApiSlice;
