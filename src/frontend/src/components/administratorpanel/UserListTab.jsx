import React, { useState, useRef, useEffect } from "react";
import {
  UsersIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { KeyRound, ChevronDown } from "lucide-react";
import "../index.css";
import { useUpdateUserMutation, useDeleteUserMutation, useUpdatePasswordMutation, useGetUsersQuery } from "../../redux/userApiSlice";
import { toast } from "react-toastify";
import { useGetUserPermissionsQuery } from '../../redux/permissionApiSlice';
import { hasPermission } from "../Utilities/permissionUtilities";
import PermissionErrorModal from '../permissions/PermissionErrorModal';
import { RoleDropdown } from '../permissions/RoleDropdown';

// Dedicated EditRoleDropdown component for the modal
const EditRoleDropdown = ({ roleOptions, selectedRole, setSelectedRole, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => setIsOpen(!isOpen);
  const handleSelect = (value) => {
    setSelectedRole(value);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Dropdown button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`flex items-center justify-between w-full px-3 py-2 text-sm border rounded-lg cursor-pointer transition-all duration-200
          ${isDarkMode
            ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-650 hover:border-gray-500'
            : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
          }
          ${isOpen ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
        `}
      >
        <span>{roleOptions.find(r => r.value === selectedRole)?.label || 'Select Role'}</span>
        <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
      </button>

      {/* Dropdown menu */}
      <div
        className={`absolute top-full mt-1 w-full rounded-lg shadow-lg border z-50 transition-all duration-200 origin-top
          ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}
          ${isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
          }
        `}
      >
        <div className="py-1 max-h-48 overflow-y-auto">
          {roleOptions.map((role) => (
            <button
              key={role.value}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm transition-colors duration-150
                ${selectedRole === role.value
                  ? 'bg-blue-500 text-white'
                  : isDarkMode
                    ? 'text-gray-200 hover:bg-gray-600'
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              onClick={() => handleSelect(role.value)}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const UserListTab = ({ isDarkMode = false, user }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  


  const { data, error, isLoading } = useGetUsersQuery()
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const { data: permissionsData } = useGetUserPermissionsQuery(user?.id);
  
  // Dynamic role options from backend data
  const roleOptions = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    const uniqueRoles = [...new Set(data.map(user => user.role))];
    return uniqueRoles.map(role => ({
      value: role,
      label: role.charAt(0).toUpperCase() + role.slice(1)
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [data]);

 
 

  // User filtering logic with role hierarchy
  const filteredUsers = (data ?? []).filter(rowUser => {
    if (rowUser.id === user?.id) return false;

    const getRoleLevel = (role) => {
      const roleLevels = {
        'admin': 1,
        'manager': 2,
        'supervisor': 3,
        'consultant': 4,
        'user': 5,
        'trainee': 6,
        'operator': 7,
        'viewer': 8
      };
      return roleLevels[role] || 4;
    };

    const currentUserLevel = getRoleLevel(user?.role);
    const targetUserLevel = getRoleLevel(rowUser.role);

    if (user?.role === 'admin') {
      return rowUser.role !== 'admin';
    }

    if (targetUserLevel > currentUserLevel) {
      return true;
    }

    if (targetUserLevel === currentUserLevel && rowUser.id !== user.id) {
      return true;
    }

    return false;
  }).filter(rowUser => {
    if (searchTerm && !rowUser.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !rowUser.email.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedRole !== 'all' && rowUser.role !== selectedRole) {
      return false;
    }
    return true;
  });

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800";
      case "manager":
        return isDarkMode ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-800";
      case "viewer":
        return isDarkMode ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-800";
      case "user":
        return isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800";
      default:
        return isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (isActive) => {
    return isActive
      ? isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"
      : isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800";
  };

  // Enhanced formatDate function to handle null values specifically for last_login
  const formatDate = (dateString) => {
    if (!dateString || dateString === null || dateString === undefined) {
      return null; // Return null so we can handle it differently
    }

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  // Enhanced Edit User with proper error handling
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      is_active: user.is_currently_logged_in,
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    const loadingToast = toast.loading("Updating user...");

    try {
      const result = await updateUser({
        id: selectedUser.id,
        admin_id: user?.id,
        username: editFormData.username,
        email: editFormData.email,
        role: editFormData.role,
      }).unwrap();

      toast.update(loadingToast, {
        render: `User "${editFormData.username}" updated successfully!`,
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });

      setShowEditModal(false);
      setSelectedUser(null);
      setEditFormData({});
    } catch (error) {
      console.error('Update error:', error);

      // Enhanced error handling for different error structures
      let errorMessage = 'Unknown error occurred';

      if (error?.data) {
        if (typeof error.data === 'string') {
          errorMessage = error.data;
        } else if (error.data.message) {
          errorMessage = error.data.message;
        } else if (error.data.error) {
          errorMessage = error.data.error;
        } else if (error.data.detail) {
          errorMessage = error.data.detail;
        } else if (error.data.non_field_errors) {
          errorMessage = Array.isArray(error.data.non_field_errors)
            ? error.data.non_field_errors.join(', ')
            : error.data.non_field_errors;
        } else {
          // Handle field-specific errors
          const fieldErrors = [];
          Object.keys(error.data).forEach(field => {
            if (Array.isArray(error.data[field])) {
              fieldErrors.push(`${field}: ${error.data[field].join(', ')}`);
            } else if (typeof error.data[field] === 'string') {
              fieldErrors.push(`${field}: ${error.data[field]}`);
            }
          });
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('; ');
          }
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.update(loadingToast, {
        render: `Failed to update user: ${errorMessage}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    const loadingToast = toast.loading("Deleting user...");

    try {
      await deleteUser(selectedUser.id).unwrap();

      toast.update(loadingToast, {
        render: `User "${selectedUser.username}" deleted successfully!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Delete error:', error);

      let errorMessage = 'Unknown error occurred';
      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.data?.error) {
        errorMessage = error.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.update(loadingToast, {
        render: `Failed to delete user: ${errorMessage}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <svg
          className="animate-spin h-6 w-6"
          style={{ color: isDarkMode ? "#60A5FA" : "#3B82F6" }}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p
          className="mt-2"
          style={{ color: isDarkMode ? "#D1D5DB" : "#6B7280" }}
        >
          Loading users...
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-1 sm:space-y-0 mb-2">
        <div className="flex items-center space-x-2">
          <h2
            className="text-lg font-semibold"
            style={{ color: isDarkMode ? "#FFF" : "#111827" }}
          >
            User Management
          </h2>
          <span
            className="text-sm font-medium px-2.5 py-0.5 rounded-full"
            style={{
              backgroundColor: isDarkMode ? "#1E40AF" : "#DBEAFE",
              color: isDarkMode ? "#93C5FD" : "#1E40AF",
            }}
          >
            {filteredUsers.length} users
          </span>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDarkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900"
                }`}
            />
          </div>
          
          {/* Keep RoleDropdown for filtering - this one works fine */}
          <RoleDropdown
            roleOptions={roleOptions}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* Table with Optimized Column Widths */}
      <div
        className="rounded-lg shadow border overflow-hidden"
        style={{
          backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
          borderColor: isDarkMode ? "#374151" : "#E5E7EB",
        }}
      >
        {filteredUsers.length === 0 ? (
          <div className="text-center py-6">
            <UsersIcon
              className="mx-auto h-12 w-12"
              style={{ color: isDarkMode ? "#6B7280" : "#9CA3AF" }}
            />
            <h3
              className="mt-2 text-sm font-medium"
              style={{ color: isDarkMode ? "#FFF" : "#111827" }}
            >
              No users found
            </h3>
            <p
              className="mt-1 text-sm"
              style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
            >
              {searchTerm || selectedRole !== "all"
                ? "Try adjusting your search or filter criteria"
                : "No users available"}
            </p>
          </div>
        ) : (
          <div className="relative overflow-auto custom-scroll" style={{ maxHeight: "250px" }}>
            <table className="min-w-full table-fixed">
              {/* Optimized Header with Reduced Widths */}
              <thead
                className="sticky top-0 z-10"
                style={{ backgroundColor: isDarkMode ? "#111827" : "#F9FAFB" }}
              >
                <tr>
                  <th
                    className="w-[30%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                  >
                    User
                  </th>
                  <th
                    className="w-[15%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                  >
                    Role
                  </th>
                  <th
                    className="w-[12%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                  >
                    Status
                  </th>
                  <th
                    className="w-[20%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                  >
                    Last Login
                  </th>
                  <th
                    className="w-[15%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                  >
                    Joined
                  </th>
                  <th
                    className="w-[8%] px-2 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Table Body with Matching Optimized Column Widths */}
              <tbody style={{ backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF" }}>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className="transition-colors"
                    style={{
                      backgroundColor: index % 2 === 0
                        ? (isDarkMode ? "#1F2937" : "#FFFFFF")
                        : (isDarkMode ? "#111827" : "#F9FAFB")
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDarkMode ? "#374151" : "#F3F4F6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0
                        ? (isDarkMode ? "#1F2937" : "#FFFFFF")
                        : (isDarkMode ? "#111827" : "#F9FAFB");
                    }}
                  >
                    {/* User Column - Optimized to 30% */}
                    <td className="w-[30%] px-4 py-2">
                      <div>
                        <div
                          className="text-sm font-medium truncate"
                          style={{ color: isDarkMode ? "#D1D5DB" : "#111827" }}
                          title={user.username}
                        >
                          {user.username}
                        </div>
                        <div
                          className="text-xs truncate"
                          style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                          title={user.email}
                        >
                          {user.email}
                        </div>
                      </div>
                    </td>

                    {/* Role Column - Reduced to 15% */}
                    <td className="w-[15%] px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>

                    {/* Status Column - Reduced to 12% */}
                    <td className="w-[12%] px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          user.is_currently_logged_in
                        )}`}
                      >
                        {user.is_currently_logged_in ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Last Login Column - Reduced to 20% */}
                    <td className="w-[20%] px-3 py-2 text-sm">
                      {user.last_login ? (
                        <span 
                          className="truncate block"
                          style={{ color: isDarkMode ? "#D1D5DB" : "#6B7280" }}
                          title={formatDate(user.last_login)}
                        >
                          {formatDate(user.last_login)}
                        </span>
                      ) : (
                        <span
                          className="italic truncate block"
                          style={{ color: isDarkMode ? "#9CA3AF" : "#9CA3AF" }}
                        >
                          Never Logged-In
                        </span>
                      )}
                    </td>

                    {/* Joined Column - Reduced to 15% */}
                    <td
                      className="w-[15%] px-3 py-2 text-sm"
                      style={{ color: isDarkMode ? "#D1D5DB" : "#6B7280" }}
                    >
                      <span 
                        className="truncate block"
                        title={formatDate(user.date_joined)}
                      >
                        {formatDate(user.date_joined)}
                      </span>
                    </td>

                    {/* Actions Column - Reduced to 8% with Compact Layout */}
                    <td className="w-[8%] px-2 py-2 text-sm font-medium">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleEditUser(user)}
                          className={`p-1 rounded transition-colors ${isDarkMode
                            ? "text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                            : "text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                            }`}
                          title="Edit User"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
              
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className={`p-1 rounded transition-colors ${isDarkMode
                            ? "text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            : "text-red-600 hover:text-red-900 hover:bg-red-50"
                            }`}
                          title="Delete User"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <>
          {hasPermission(permissionsData, 'edit_user') ? (
            <div 
              className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
              onClick={() => setShowEditModal(false)}
            >
              <div
                className="rounded-xl p-6 max-w-2xl w-full relative shadow-2xl border mx-4"
                style={{
                  background: isDarkMode
                    ? 'rgba(15, 23, 42, 0.8)'
                    : 'rgba(246, 245, 248, 1)',
                  borderColor: isDarkMode
                    ? 'rgba(51, 65, 85, 0.4)'
                    : 'rgba(203, 213, 225, 0.3)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className={isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3
                      className="text-lg leading-6 font-medium mb-4"
                      style={{ color: isDarkMode ? "#FFF" : "#111827" }}
                    >
                      Edit User: {selectedUser?.username}
                    </h3>

                    <form onSubmit={handleUpdateUser} className="space-y-4">
                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: isDarkMode ? "#D1D5DB" : "#374151" }}
                        >
                          Username
                        </label>
                        <input
                          type="text"
                          value={editFormData.username}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, username: e.target.value })
                          }
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                            }`}
                          required
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: isDarkMode ? "#D1D5DB" : "#374151" }}
                        >
                          Email
                        </label>
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, email: e.target.value })
                          }
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                            }`}
                          required
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: isDarkMode ? "#D1D5DB" : "#374151" }}
                        >
                          Role
                        </label>
                        {/* FIXED: Use dedicated EditRoleDropdown for modal */}
                        <EditRoleDropdown
                          roleOptions={roleOptions}
                          selectedRole={editFormData.role}
                          setSelectedRole={(role) => setEditFormData({ ...editFormData, role })}
                          isDarkMode={isDarkMode}
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={editFormData.is_active || false}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              is_active: e.target.checked,
                            })
                          }
                          className="mr-2"
                        />
                        <label
                          htmlFor="is_active"
                          className="text-sm font-medium"
                          style={{ color: isDarkMode ? "#D1D5DB" : "#374151" }}
                        >
                          Active User
                        </label>
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowEditModal(false)}
                          className={`px-4 py-2 rounded-lg ${isDarkMode
                            ? "text-gray-300 bg-gray-600 hover:bg-gray-500"
                            : "text-gray-700 bg-gray-200 hover:bg-gray-300"
                            }`}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Update User
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <PermissionErrorModal
              show={true}
              onClose={() => setShowEditModal(false)}
              isDarkMode={isDarkMode}
              permissionName="edit_user"
              actionDescription="edit users"
              title="Edit User Denied"
            />
          )}
        </>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && (
        <>
          {hasPermission(permissionsData, 'delete_user') ? (
            <div 
              className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
              onClick={() => setShowDeleteModal(false)}
            >
              <div
                className="rounded-xl p-6 max-w-lg w-full relative shadow-2xl border mx-4"
                style={{
                  background: isDarkMode
                    ? 'rgba(15, 23, 42, 0.8)'
                    : 'rgba(246, 245, 248, 1)',
                  borderColor: isDarkMode
                    ? 'rgba(51, 65, 85, 0.4)'
                    : 'rgba(203, 213, 225, 0.3)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className={isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3
                      className="text-lg leading-6 font-medium"
                      style={{ color: isDarkMode ? "#F1F5F9" : "#1E293B" }}
                    >
                      Delete User
                    </h3>
                    <div className="mt-2">
                      <p
                        className="text-sm"
                        style={{ color: isDarkMode ? "#D1D5DB" : "#6B7280" }}
                      >
                        Are you sure you want to delete user "{selectedUser?.username}"?
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={confirmDeleteUser}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-600 text-gray-300 hover:bg-gray-500"
                        : "border-gray-300 bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <PermissionErrorModal
              show={true}
              onClose={() => setShowDeleteModal(false)}
              isDarkMode={isDarkMode}
              permissionName="delete_user"
              actionDescription="delete users"
              title="Delete User Denied"
            />
          )}
        </>
      )}
      
    </>
  );
};

export default UserListTab;
