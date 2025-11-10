import React, { useState, useRef, useEffect } from "react";
import {
  UsersIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { ChevronDown } from "lucide-react";
import "../index.css";
import {
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetUsersQuery,
} from "../../redux/userApiSlice";
import { useGetRolesQuery } from "../../redux/roleApiSlice";
import { toast } from "react-toastify";
import { RoleDropdown } from "../permissions/RoleDropdown";
import UserCreationModal from "./UserCreationModal";
import RenderIfAllowed from "../Utilities/RenderIfAllowed";
import { useAuth } from "../../Contexts/AuthContext";


//  EditRoleDropdown: Used in Edit Modal - Shows ALL roles from API
const EditRoleDropdown = ({
  roleOptions = [],
  selectedRole,
  setSelectedRole,
  isDarkMode,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isLoading) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (value) => {
    setSelectedRole(value);
    setIsOpen(false);
  };

  const selectedRoleLabel = React.useMemo(() => {
    if (isLoading) return "Loading roles...";
    if (!Array.isArray(roleOptions) || roleOptions.length === 0) {
      return "Select Role";
    }
    const found = roleOptions.find((r) => r?.value === selectedRole);
    return found?.label || "Select Role";
  }, [roleOptions, selectedRole, isLoading]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        className={`flex items-center justify-between w-full px-3 py-2 text-sm border rounded-lg cursor-pointer transition-all duration-200
          ${
            isDarkMode
              ? "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-650 hover:border-gray-500"
              : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
          }
          ${isOpen ? "ring-2 ring-blue-500 ring-opacity-50" : ""}
          ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <span>{selectedRoleLabel}</span>
        <ChevronDown
          className={`w-4 h-4 ml-1 transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      <div
        className={`absolute top-full mt-1 w-full rounded-lg shadow-lg border z-50 transition-all duration-200 origin-top
          ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}
          ${
            isOpen
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
          }
        `}
      >
        <div className="py-1 max-h-48 overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading roles...</div>
          ) : Array.isArray(roleOptions) && roleOptions.length > 0 ? (
            roleOptions.map((role) => (
              <button
                key={role?.value || Math.random()}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm transition-colors duration-150
                  ${
                    selectedRole === role?.value
                      ? "bg-blue-500 text-white"
                      : isDarkMode
                      ? "text-gray-200 hover:bg-gray-600"
                      : "text-gray-900 hover:bg-gray-100"
                  }`}
                onClick={() => handleSelect(role?.value)}
              >
                {role?.label || "Unknown Role"}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              No roles available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const UserListTab = ({ isDarkMode = false }) => { 
  // Get user from Auth context
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  //  Fetch users list
  const { data, error, isLoading, refetch } = useGetUsersQuery();
  console.log("Fetched users data:", data);
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  
  //  Fetch ALL roles from API (for edit modal dropdown)
  const { data: rolesData = [], isLoading: rolesLoading, error: rolesError } = useGetRolesQuery();
  
  //  editRoleOptions: For Edit Modal - Contains ALL roles from database with UUIDs
  const editRoleOptions = React.useMemo(() => {
    if (!Array.isArray(rolesData) || rolesData.length === 0) {
      return [];
    }

    return rolesData.map(role => ({
      value: role.uuid, //  UUID for API calls (backend expects UUID)
      label: role.role_name || role.name || 'Unknown Role'
    }));
  }, [rolesData]);

  const filteredUsers = React.useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }

    if (data.length === 0) {
      return [];
    }

    let result = [...data];

    //  Filter by search term (username or email)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((rowUser) => {
        const username = rowUser?.username?.toLowerCase() || "";
        const email = rowUser?.email?.toLowerCase() || "";
        return username.includes(searchLower) || email.includes(searchLower);
      });
    }

    //  Filter by selected role (uses role_name for filtering)
    if (selectedRole !== "all") {
      result = result.filter((rowUser) => rowUser?.role_name === selectedRole);
    }

    return result;
  }, [data, searchTerm, selectedRole]);

  const getRoleBadgeColor = (role) => {
    return isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800";
  };

  const getStatusBadgeColor = (isActive) => {
    return isActive
      ? isDarkMode
        ? "bg-green-900 text-green-300"
        : "bg-green-100 text-green-800"
      : isDarkMode
      ? "bg-red-900 text-red-300"
      : "bg-red-100 text-red-800";
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === null || dateString === undefined) {
      return null;
    }

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  };

  //Initialize edit form with user data (uses role_uuid for API)
  const handleEditUser = (userToEdit) => {
    setSelectedUser(userToEdit);
    
    //Find the role UUID from the role name
    const matchingRole = editRoleOptions.find(
      role => role.label === userToEdit?.role_name
    );
    
    setEditFormData({
      username: userToEdit?.username || "",
      email: userToEdit?.email || "",
      role: matchingRole?.value || "",
      is_active: userToEdit?.is_currently_logged_in || false,
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    const loadingToast = toast.loading("Updating user...");

    try {
      await updateUser({
        id: selectedUser?.id,
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
      refetch();
    } catch (error) {
      console.error("Update error:", error);

      let errorMessage = "Unknown error occurred";

      if (error?.data) {
        if (typeof error.data === "string") {
          errorMessage = error.data;
        } else if (error.data.message) {
          errorMessage = error.data.message;
        } else if (error.data.error) {
          errorMessage = error.data.error;
        } else if (error.data.detail) {
          errorMessage = error.data.detail;
        } else if (error.data.non_field_errors) {
          errorMessage = Array.isArray(error.data.non_field_errors)
            ? error.data.non_field_errors.join(", ")
            : error.data.non_field_errors;
        } else {
          const fieldErrors = [];
          Object.keys(error.data).forEach((field) => {
            if (Array.isArray(error.data[field])) {
              fieldErrors.push(
                `${field}: ${error.data[field].join(", ")}`
              );
            } else if (typeof error.data[field] === "string") {
              fieldErrors.push(`${field}: ${error.data[field]}`);
            }
          });
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join("; ");
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

  const handleDeleteUser = (userToDelete) => {
    setSelectedUser(userToDelete);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    const loadingToast = toast.loading("Deleting user...");

    try {
      await deleteUser(selectedUser?.id).unwrap();

      toast.update(loadingToast, {
        render: `User "${selectedUser?.username}" deleted successfully!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setShowDeleteModal(false);
      setSelectedUser(null);
      refetch();
    } catch (error) {
      console.error("Delete error:", error);

      let errorMessage = "Unknown error occurred";
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Users refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh users");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUserCreated = () => {
    refetch();
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-4">
        <div className="flex items-center space-x-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: isDarkMode ? "#FFF" : "#111827" }}
          >
            User Management
          </h2>
          
          <RenderIfAllowed module="users_management" action="create">
            <button
              onClick={() => setShowCreateUserModal(true)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? "bg-blue-900/20 text-blue-400 hover:bg-blue-900/40"
                  : "bg-blue-100 text-blue-600 hover:bg-blue-200"
              }`}
              title="Add New User"
            >
              <UserPlusIcon className="w-5 h-5" />
            </button>
          </RenderIfAllowed>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "bg-green-900/20 text-green-400 hover:bg-green-900/40"
                : "bg-green-100 text-green-600 hover:bg-green-200"
            } ${isRefreshing ? "opacity-50 cursor-not-allowed" : ""}`}
            title="Refresh Users"
          >
            <ArrowPathIcon
              className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>

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
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
          </div>

          {/*RoleDropdown: Extracts roles from user data, only shows roles with users */}
          <RoleDropdown
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            isDarkMode={isDarkMode}
            userData={data}
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
          <div
            className="relative overflow-auto custom-scroll"
            style={{ maxHeight: "530px" }}
          >
            <table className="min-w-full table-fixed">
              <thead
                className="sticky top-0 z-10"
                style={{
                  backgroundColor: isDarkMode ? "#111827" : "#F9FAFB",
                }}
              >
                <tr>
                  <th
                    className="w-[20%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                  >
                    User
                  </th>
                  <th
                    className="w-[15%] px-3 py-3 text-center text-xs font-medium uppercase tracking-wider"
                    style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                  >
                    Role
                  </th>
                  <th
                    className="w-[12%] px-3 py-3 text-center text-xs font-medium uppercase tracking-wider"
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

              <tbody style={{ backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF" }}>
                {filteredUsers.map((rowUser, index) => (
                  <tr
                    key={rowUser?.id}
                    className="transition-colors"
                    style={{
                      backgroundColor:
                        index % 2 === 0
                          ? isDarkMode
                            ? "#1F2937"
                            : "#FFFFFF"
                          : isDarkMode
                          ? "#111827"
                          : "#F9FAFB",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDarkMode
                        ? "#374151"
                        : "#F3F4F6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        index % 2 === 0
                          ? isDarkMode
                            ? "#1F2937"
                            : "#FFFFFF"
                          : isDarkMode
                          ? "#111827"
                          : "#F9FAFB";
                    }}
                  >
                    <td className="w-[20%] px-3 py-2">
                      <div>
                        <div
                          className="text-sm font-medium truncate"
                          style={{
                            color: isDarkMode ? "#D1D5DB" : "#111827",
                          }}
                          title={rowUser?.username}
                        >
                          {rowUser?.username || "N/A"}
                        </div>
                        <div
                          className="text-xs truncate"
                          style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                          title={rowUser?.email}
                        >
                          {rowUser?.email || "N/A"}
                        </div>
                      </div>
                    </td>

                    <td className="w-[15%] px-3 py-2 text-center align-middle">
                      <div className="flex justify-center items-center h-full">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            rowUser?.role_name
                          )}`}
                          title={rowUser?.role_name}
                        >
                          {rowUser?.role_name || "N/A"}
                        </span>
                      </div>
                    </td>

                    <td className="w-[12%] px-3 py-2 text-center align-middle">
                      <div className="flex justify-center items-center h-full">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                            rowUser?.is_currently_logged_in
                          )}`}
                        >
                          {rowUser?.is_currently_logged_in
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>
                    </td>

                    <td className="w-[20%] px-3 py-2 text-sm">
                      {rowUser?.last_login ? (
                        <span
                          className="truncate block"
                          style={{
                            color: isDarkMode ? "#D1D5DB" : "#6B7280",
                          }}
                          title={formatDate(rowUser.last_login)}
                        >
                          {formatDate(rowUser.last_login)}
                        </span>
                      ) : (
                        <span
                          className="italic truncate block"
                          style={{
                            color: isDarkMode ? "#9CA3AF" : "#9CA3AF",
                          }}
                        >
                          Never Logged-In
                        </span>
                      )}
                    </td>

                    <td
                      className="w-[15%] px-3 py-2 text-sm"
                      style={{ color: isDarkMode ? "#D1D5DB" : "#6B7280" }}
                    >
                      <span
                        className="truncate block"
                        title={formatDate(rowUser?.date_joined)}
                      >
                        {formatDate(rowUser?.date_joined) || "N/A"}
                      </span>
                    </td>

                    <td className="w-[8%] px-2 py-2 text-sm font-medium">
                      <div className="flex items-center justify-center space-x-1">
                        {/* Check if this row is the current logged-in user */}
                        {rowUser?.id === user?.id ? (
                          /* Show disabled buttons for current user */
                          <>
                            <button
                              disabled
                              className={`p-1 rounded cursor-not-allowed opacity-50 ${
                                isDarkMode ? "text-gray-600" : "text-gray-400"
                              }`}
                              title="Cannot edit your own account"
                            >
                              <PencilIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled
                              className={`p-1 rounded cursor-not-allowed opacity-50 ${
                                isDarkMode ? "text-gray-600" : "text-gray-400"
                              }`}
                              title="Cannot delete your own account"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          /* Show normal buttons for other users */
                          <>
                            <RenderIfAllowed module="users_management" action="update">
                              <button
                                onClick={() => handleEditUser(rowUser)}
                                className={`p-1 rounded transition-colors ${
                                  isDarkMode
                                    ? "text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                    : "text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                                }`}
                                title="Edit User"
                              >
                                <PencilIcon className="w-3.5 h-3.5" />
                              </button>
                            </RenderIfAllowed>

                            <RenderIfAllowed module="users_management" action="delete">
                              <button
                                onClick={() => handleDeleteUser(rowUser)}
                                className={`p-1 rounded transition-colors ${
                                  isDarkMode
                                    ? "text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                    : "text-red-600 hover:text-red-900 hover:bg-red-50"
                                }`}
                                title="Delete User"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </RenderIfAllowed>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Creation Modal */}
      <UserCreationModal
        userId={user?.id}
        show={showCreateUserModal}
        onHide={() => setShowCreateUserModal(false)}
        onUserCreated={handleUserCreated}
        isDarkMode={isDarkMode}
      />

      {/* Edit User Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.1)" }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="rounded-xl p-6 max-w-2xl w-full relative shadow-2xl border mx-4"
            style={{
              background: isDarkMode
                ? "rgba(15, 23, 42, 0.8)"
                : "rgba(246, 245, 248, 1)",
              borderColor: isDarkMode
                ? "rgba(51, 65, 85, 0.4)"
                : "rgba(203, 213, 225, 0.3)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 pt-4 pr-4">
              <button
                onClick={() => setShowEditModal(false)}
                className={
                  isDarkMode
                    ? "text-gray-400 hover:text-gray-300"
                    : "text-gray-400 hover:text-gray-600"
                }
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
                      style={{
                        color: isDarkMode ? "#D1D5DB" : "#374151",
                      }}
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      value={editFormData.username}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          username: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{
                        color: isDarkMode ? "#D1D5DB" : "#374151",
                      }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          email: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{
                        color: isDarkMode ? "#D1D5DB" : "#374151",
                      }}
                    >
                      Role
                    </label>
                    {/*  EditRoleDropdown: Shows ALL roles from API */}
                    <EditRoleDropdown
                      roleOptions={editRoleOptions || []}
                      selectedRole={editFormData.role || ""}
                      setSelectedRole={(role) =>
                        setEditFormData({ ...editFormData, role })
                      }
                      isDarkMode={isDarkMode}
                      isLoading={rolesLoading}
                    />
                    
                    {rolesError && (
                      <p className="mt-0.5 text-xs text-red-600">
                        Error loading roles. Please try again.
                      </p>
                    )}
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
                      style={{
                        color: isDarkMode ? "#D1D5DB" : "#374151",
                      }}
                    >
                      Active User
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className={`px-4 py-2 rounded-lg ${
                        isDarkMode
                          ? "text-gray-300 bg-gray-600 hover:bg-gray-500"
                          : "text-gray-700 bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={rolesLoading}
                      className="px-4 py-2 bg-[#6366f1] text-white rounded-lg hover:bg-[#6366f1]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Update User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.1)" }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="rounded-xl p-6 max-w-lg w-full relative shadow-2xl border mx-4"
            style={{
              background: isDarkMode
                ? "rgba(15, 23, 42, 0.8)"
                : "rgba(246, 245, 248, 1)",
              borderColor: isDarkMode
                ? "rgba(51, 65, 85, 0.4)"
                : "rgba(203, 213, 225, 0.3)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 pt-4 pr-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className={
                  isDarkMode
                    ? "text-gray-400 hover:text-gray-300"
                    : "text-gray-400 hover:text-gray-600"
                }
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
                  style={{
                    color: isDarkMode ? "#F1F5F9" : "#1E293B",
                  }}
                >
                  Delete User
                </h3>
                <div className="mt-2">
                  <p
                    className="text-sm"
                    style={{
                      color: isDarkMode ? "#D1D5DB" : "#6B7280",
                    }}
                  >
                    Are you sure you want to delete user "
                    {selectedUser?.username}"? This action cannot be undone.
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
      )}
    </>
  );
};

export default UserListTab;
