import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';


export const auditLogsApi = createApi({
    reducerPath: 'auditLogsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api/webuser/',
        credentials: 'include',
    }),
    tagTypes: ['AuditLog'],
    endpoints: (builder) => ({
        getAuditLogs: builder.query({
            query: ({
                page = 1,
                page_size = 9,
                user = '',
                action = '',
                model_name = '',
                severity = '',
                start_date = '',
                end_date = '',
                search = '',
            } = {}) => {
                const params = new URLSearchParams();


                params.append('page', page);
                params.append('page_size', page_size);
                if (user) params.append('user', user);
                if (action) params.append('action', action);
                if (model_name) params.append('model_name', model_name);
                if (severity) params.append('severity_display', severity);
                if (start_date) params.append('start_date', start_date);
                if (end_date) params.append('end_date', end_date);
                if (search) params.append('search', search);

                return `get_auditlogs/?${params.toString()}`;
            },
            providesTags: ['AuditLog'],
            transformResponse: (response) => ({
                audit_logs: response.results?.audit_logs || [],
                count: response.count || 0,
                next: response.next,
                previous: response.previous,
            }),
        }),

        getFilterOptions: builder.query({
            query: () => 'get_filter_options/',
            transformResponse: (response) => {
                const severities = response.severities
                    ? Array.from(new Set(response.severities.map(s => s.label)))
                    : [];

                return {
                    users: response.users || [],
                    actions: response.actions || [],
                    resources: response.resources || [],
                    severities,
                };
            },
        }),

        // Export endpoint for downloading all filtered data
        exportAuditLogs: builder.query({
            query: ({
                user = '',
                action = '',
                model_name = '',
                severity = '',
                start_date = '',
                end_date = '',
                search = '',
            } = {}) => {
                const params = new URLSearchParams();

                // Apply same filters as getAuditLogs (NO pagination)
                if (user) params.append('user', user);
                if (action) params.append('action', action);
                if (model_name) params.append('model_name', model_name);
                if (severity) params.append('severity_display', severity);
                if (start_date) params.append('start_date', start_date);
                if (end_date) params.append('end_date', end_date);
                if (search) params.append('search', search);

                return {
                    url: `audit_logs/download/?${params.toString()}`,
                    responseHandler: (response) => response.blob(),
                };
            },
        }),
    }),
});


export const {
    useGetAuditLogsQuery,
    useLazyGetFilterOptionsQuery,
    useLazyExportAuditLogsQuery,
} = auditLogsApi;
