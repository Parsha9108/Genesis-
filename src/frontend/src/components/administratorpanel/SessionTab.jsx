import React, { useState } from 'react';
import { ArrowPathIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useGetUsersQuery } from '../../redux/userApiSlice';

const SessionsTab = ({isDarkMode = false }) => {
  const [activeView, setActiveView] = useState('attempts');
  const { data: users = [], error, isLoading } = useGetUsersQuery(undefined, {
  refetchOnMountOrArgChange: true
  });
  
 // Active sessions: currently logged-in users
  const sessions = users.filter(user => user.is_currently_logged_in);

  // Login attempts: map all users' last_login (or last_login_time) as login events, sorted newest first
  const loginAttempts = users
    .map(user => {
      const isLoggedIn = user.is_currently_logged_in;
      const date = isLoggedIn
      ? (user.last_login || user.date_joined)
      : (user.last_logout_time || user.date_joined)
      return {
        user: user.username,
        // Select the appropriate timestamp
        date,
        action: isLoggedIn ? 'Logged In' : 'Logged Out',
        role: user.role,
      };
    })
    // Sort by the chosen date descending
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const getActionBadgeColor = (action, status) => {
    if (action === 'Logged Out' || status === 'logout') {
      return isDarkMode ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-800';
    }
    if (action === 'Logged In' || status === 'success') {
      return isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800';
    }
    if (status === 'failed') {
      return isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800';
    }
    return isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'administrator':
      case 'admin':
        return isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800';
      case 'manager':
        return isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
      case 'user':
        return isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800';
      default:
        return isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveView('sessions')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'sessions'
              ? 'bg-[#6366F1] text-white'
              : (isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
              }`}
          >
            Active Sessions ({sessions.length})
          </button>
          <button
            onClick={() => setActiveView('attempts')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'attempts'
              ? 'bg-[#6366F1] text-white'
              : (isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
              }`}
          >
            Login Attempts ({loginAttempts.length})
          </button>
        </div>
      </div>

      {/* ✅ FIXED: Login Attempts View with Unified Table Structure */}
      {activeView === 'attempts' && (
        <div
          className="rounded-lg shadow border overflow-hidden"
          style={{
            backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
            borderColor: isDarkMode ? '#374151' : '#E5E7EB'
          }}
        >
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}
          >
            <h3
              className="text-base font-medium"
              style={{ color: isDarkMode ? '#FFF' : '#111827' }}
            >
              Recent Login Attempts
            </h3>
          </div>
          {loginAttempts.length > 0 ? (
            <div className="relative overflow-auto custom-scroll" style={{ maxHeight: '180px' }}>
              <table className="min-w-full table-fixed">
                <thead
                  className="sticky top-0 z-10"
                  style={{ backgroundColor: isDarkMode ? '#111827' : '#F9FAFB' }}
                >
                  <tr>
                    <th
                      className="w-2/5 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                    >
                      Date
                    </th>
                    <th
                      className="w-2/5 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                    >
                      User
                    </th>
                    <th
                      className="w-1/5 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                {/* ✅ Table Body with Matching Column Widths */}
                <tbody style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' }}>
                  {loginAttempts.map((attempt, index) => (
                    <tr
                      key={index}
                      className="transition-colors"
                      style={{
                        backgroundColor: index % 2 === 0
                          ? (isDarkMode ? '#1F2937' : '#FFFFFF')
                          : (isDarkMode ? '#111827' : '#F9FAFB')
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#F3F4F6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = index % 2 === 0
                          ? (isDarkMode ? '#1F2937' : '#FFFFFF')
                          : (isDarkMode ? '#111827' : '#F9FAFB');
                      }}
                    >
                      <td className="w-2/5 px-4 py-1.5 text-sm truncate" style={{ color: isDarkMode ? '#D1D5DB' : '#111827' }}>
                        {new Date(attempt.date).toLocaleString()}
                      </td>
                      <td className="w-2/5 px-4 py-1.5">
                        <div className="text-sm font-medium truncate" style={{ color: isDarkMode ? '#FFF' : '#111827' }}>
                          {attempt.user}
                        </div>
                      </td>
                      <td className="w-1/5 px-4 py-1.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(attempt.action, attempt.status)}`}>
                          {attempt.action.trim()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <ClockIcon className="mx-auto h-8 w-8" style={{ color: isDarkMode ? '#6B7280' : '#9CA3AF' }} />
              <h3 className="mt-2 text-sm font-medium" style={{ color: isDarkMode ? '#FFF' : '#111827' }}>
                No login attempts
              </h3>
              <p className="mt-1 text-sm" style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
                No recent login attempts found.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ✅ FIXED: Active Sessions View with Unified Table Structure */}
      {activeView === 'sessions' && (
        <div
          className="rounded-lg shadow border overflow-hidden"
          style={{
            backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
            borderColor: isDarkMode ? '#374151' : '#E5E7EB'
          }}
        >
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}
          >
            <h3
              className="text-base font-medium"
              style={{ color: isDarkMode ? '#FFF' : '#111827' }}
            >
              Active Sessions
            </h3>
          </div>
          {sessions.length > 0 ? (
            <div className="relative overflow-auto custom-scroll" style={{ maxHeight: '180px' }}>
              <table className="min-w-full table-fixed">
                {/* ✅ Sticky Header with Fixed Widths */}
                <thead
                  className="sticky top-0 z-10"
                  style={{ backgroundColor: isDarkMode ? '#111827' : '#F9FAFB' }}
                >
                  <tr>
                    <th
                      className="w-1/4 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                    >
                      User
                    </th>
                    <th
                      className="w-1/4 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                    >
                      Role
                    </th>
                    <th
                      className="w-1/3 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                    >
                      Login Time
                    </th>
                    <th
                      className="w-1/6 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                {/* ✅ Table Body with Matching Column Widths */}
                <tbody style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' }}>
                  {sessions.map((session, index) => (
                    <tr
                      key={session.id}
                      className="transition-colors"
                      style={{
                        backgroundColor: index % 2 === 0
                          ? (isDarkMode ? '#1F2937' : '#FFFFFF')
                          : (isDarkMode ? '#111827' : '#F9FAFB')
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#F3F4F6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = index % 2 === 0
                          ? (isDarkMode ? '#1F2937' : '#FFFFFF')
                          : (isDarkMode ? '#111827' : '#F9FAFB');
                      }}
                    >
                      <td className="w-1/4 px-4 py-1.5">
                        <div className="text-sm font-medium truncate" style={{ color: isDarkMode ? '#FFF' : '#111827' }}>
                          {session.username}
                        </div>
                      </td>
                      <td className="w-1/4 px-4 py-1.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(session.role)}`}>
                          {session.role}
                        </span>
                      </td>
                      <td className="w-1/3 px-4 py-1.5 text-sm truncate" style={{ color: isDarkMode ? '#D1D5DB' : '#6B7280' }}>
                        {new Date(session.last_login).toLocaleString()}
                      </td>
                      <td className="w-1/6 px-4 py-1.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`}>
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <ClockIcon className="mx-auto h-8 w-8" style={{ color: isDarkMode ? '#6B7280' : '#9CA3AF' }} />
              <h3 className="mt-2 text-sm font-medium" style={{ color: isDarkMode ? '#FFF' : '#111827' }}>
                No active sessions
              </h3>
              <p className="mt-1 text-sm" style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
                No active sessions found.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Custom Scrollbar CSS */}
      <style jsx>{`
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#374151' : '#F3F4F6'};
          border-radius: 3px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#6B7280' : '#D1D5DB'};
          border-radius: 3px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#9CA3AF' : '#9CA3AF'};
        }
      `}</style>
    </div>
  );
};

export default SessionsTab;
