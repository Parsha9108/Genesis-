import React from 'react';
import ProfileTab from '../administratorpanel/ProfileTab';
import { useAuth } from '../../Contexts/AuthContext';
import {
  UserIcon,
} from '@heroicons/react/24/outline';

const AdminPanel = ({ isDarkMode = true }) => {
  const { user } = useAuth();
  console.log("This is the current user",user)

  return (
    <>
      {/* ✅ Main Content Container */}
      <div
        className="w-full mx-auto"
        style={{
          maxWidth: '993px',
          marginTop: '-8px'
        }}
      >
        {/* ✅ Content Container */}
        <div
          className="rounded-lg shadow-md relative"
          style={{
            backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
            border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB'
          }}
        >
          {/* ✅ Title Section */}
          <div
            className="p-4 sm:p-6 flex justify-between items-center border-b"
            style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}
          >
            <div className="flex items-center gap-4">
              <UserIcon className="w-6 h-6" style={{ color: isDarkMode ? '#3B82F6' : '#2563EB' }} />
              <h1
                className="text-xl sm:text-2xl font-bold"
                style={{ color: isDarkMode ? '#FFF' : '#111827' }}
              >
                User Profile
              </h1>
            </div>
          </div>

          {/* ✅ Profile Content */}
          <div className="p-6">
            <ProfileTab user={user} isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPanel;

