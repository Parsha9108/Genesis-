import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  UsersIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  EyeIcon,
  EyeSlashIcon,
  UserGroupIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { ChevronDown, KeyRound } from "lucide-react";
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
import BulkActionModal from "./BulkActionModal";

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
          ${isDarkMode
            ? "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-650 hover:border-gray-500"
            : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
          }
          ${isOpen ? "ring-2 ring-blue-500 ring-opacity-50" : ""}
          ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <span>{selectedRoleLabel}</span>
        <ChevronDown
          className={`w-4 h-4 ml-1 transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"
            }`}
        />
      </button>

      <div
        className={`absolute top-full mt-1 w-full rounded-lg shadow-lg border z-50 transition-all duration-200 origin-top
          ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}
          ${isOpen
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
                  ${selectedRole === role?.value
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

  //Password Reset Modal State
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [passwordResetData, setPasswordResetData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  // Multiple user selection
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
  const actionsDropdownRef = useRef(null);

  //Track which fields were modified
  const [modifiedFields, setModifiedFields] = useState(new Set());
  const [originalUserData, setOriginalUserData] = useState({});

  // BULK MODAL STATE VARIABLES
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [currentBulkAction, setCurrentBulkAction] = useState(null);

  //  Fetch users list
  const { data, error, isLoading, refetch } = useGetUsersQuery();
  console.log("Fetched users data:", data);
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  //  Fetch ALL roles from API (for edit modal dropdown)
  const { data: rolesData = [], isLoading: rolesLoading, error: rolesError } = useGetRolesQuery();

  //  editRoleOptions: For Edit Modal - Contains ALL roles from database with UUIDs
  const editRoleOptions = useMemo(() => {
    if (!Array.isArray(rolesData) || rolesData.length === 0) {
      return [];
    }

    return rolesData.map(role => ({
      value: role.uuid, //  UUID for API calls (backend expects UUID)
      label: role.role_name || role.name || 'Unknown Role'
    }));
  }, [rolesData]);

  const filteredUsers = useMemo(() => {
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

  // DYNAMIC BULK ACTION CONFIGS
  const bulkDeleteConfig = useMemo(() => ({
    title: 'Delete Users',
    message: `Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`,
    icon: TrashIcon,
    iconColor: isDarkMode ? '#F87171' : '#EF4444',
    iconBgColor: isDarkMode ? '#7F1D1D' : '#FEE2E2',
    itemLabel: 'Selected Users',
    itemUnit: 'user(s)',
    dropdownLabel: 'Confirm Deletion',
    dropdownPlaceholder: 'Select an option',
    showDropdown: true,
    requireSelection: true,
    cancelValue: 'false',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    buttonText: 'Delete Users',
    buttonColor: 'red',
    processingText: 'Deleting...',
    onAction: async (userIds, selectedValue) => {
      if (selectedValue !== 'true') return;

      const loadingToast = toast.loading(`Deleting ${userIds.length} user(s)...`);

      try {
        const promises = userIds.map(id => deleteUser(id).unwrap());
        const results = await Promise.allSettled(promises);

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;

        if (successCount && !failCount) {
          toast.update(loadingToast, {
            render: `Successfully deleted ${successCount} user(s)`,
            type: 'success',
            isLoading: false,
            autoClose: 3000,
          });
        } else if (successCount && failCount) {
          toast.update(loadingToast, {
            render: `Deleted ${successCount} user(s), ${failCount} failed`,
            type: 'warning',
            isLoading: false,
            autoClose: 5000,
          });
        } else {
          toast.update(loadingToast, {
            render: `Failed to delete ${failCount} user(s)`,
            type: 'error',
            isLoading: false,
            autoClose: 5000,
          });
        }
      } catch (error) {
        toast.update(loadingToast, {
          render: 'An error occurred during bulk deletion',
          type: 'error',
          isLoading: false,
          autoClose: 5000,
        });
      }
    },
  }), [selectedUsers.length, isDarkMode, deleteUser]);

  const bulkEditRolesConfig = useMemo(() => ({
    title: 'Edit User Roles',
    message: `Select a role to assign to ${selectedUsers.length} user(s).`,
    icon: UserGroupIcon,
    iconColor: isDarkMode ? '#60A5FA' : '#3B82F6',
    iconBgColor: isDarkMode ? '#1E3A8A' : '#DBEAFE',
    itemLabel: 'Selected Users',
    itemUnit: 'user(s)',
    dropdownLabel: 'Select Role',
    dropdownPlaceholder: 'Choose a role',
    showDropdown: true,
    requireSelection: true,
    cancelValue: null,
    options: editRoleOptions,
    buttonText: 'Update Roles',
    buttonColor: 'blue',
    processingText: 'Updating...',
    onAction: async (userIds, roleUuid) => {
      if (!roleUuid) return;

      const loadingToast = toast.loading(`Updating roles for ${userIds.length} user(s)...`);

      try {
        const promises = userIds.map(id =>
          updateUser({ id, role: roleUuid }).unwrap()
        );
        const results = await Promise.allSettled(promises);

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;

        if (successCount && !failCount) {
          toast.update(loadingToast, {
            render: `Successfully updated ${successCount} user(s)`,
            type: 'success',
            isLoading: false,
            autoClose: 3000,
          });
        } else if (successCount && failCount) {
          toast.update(loadingToast, {
            render: `Updated ${successCount} user(s), ${failCount} failed`,
            type: 'warning',
            isLoading: false,
            autoClose: 5000,
          });
        } else {
          toast.update(loadingToast, {
            render: `Failed to update ${failCount} user(s)`,
            type: 'error',
            isLoading: false,
            autoClose: 5000,
          });
        }
      } catch (error) {
        toast.update(loadingToast, {
          render: 'An error occurred during role update',
          type: 'error',
          isLoading: false,
          autoClose: 5000,
        });
      }
    },
  }), [selectedUsers.length, isDarkMode, editRoleOptions, updateUser]);

  const bulkOverrideEmailConfig = useMemo(() => ({
    title: 'Email Verification Control',
    message: `Control email verification for ${selectedUsers.length} user(s)?`,
    icon: EnvelopeIcon,
    iconColor: isDarkMode ? '#34D399' : '#10B981',
    iconBgColor: isDarkMode ? '#064E3B' : '#D1FAE5',
    itemLabel: 'Selected Users',
    itemUnit: 'user(s)',
    dropdownLabel: 'Email Verification',
    dropdownPlaceholder: 'Select an option',
    showDropdown: true,
    requireSelection: true,
    cancelValue: null,
    options: [
      { value: 'enable', label: 'Enable Email Verification' },
      { value: 'disable', label: 'Disable Email Verification' }
    ],
    buttonText: 'Update Verification',
    buttonColor: 'green',
    processingText: 'Updating...',
    onAction: async (userIds, selectedValue) => {
      if (!selectedValue) return;

      const isEmailOverride = selectedValue === 'disable';

      const actionText = selectedValue === 'enable' ? 'Enabling' : 'Disabling';
      const loadingToast = toast.loading(`${actionText} email verification...`);

      try {
        const promises = userIds.map(id =>
          updateUser({
            id,
            is_email_override: isEmailOverride
          }).unwrap()
        );
        const results = await Promise.allSettled(promises);

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;

        if (successCount && !failCount) {
          toast.update(loadingToast, {
            render: `Email verification ${selectedValue === 'enable' ? 'enabled' : 'disabled'} for ${successCount} user(s)`,
            type: 'success',
            isLoading: false,
            autoClose: 3000,
          });
        } else if (successCount && failCount) {
          toast.update(loadingToast, {
            render: `Updated ${successCount} user(s), ${failCount} failed`,
            type: 'warning',
            isLoading: false,
            autoClose: 5000,
          });
        } else {
          toast.update(loadingToast, {
            render: `Failed to update ${failCount} user(s)`,
            type: 'error',
            isLoading: false,
            autoClose: 5000,
          });
        }
      } catch (error) {
        toast.update(loadingToast, {
          render: 'An error occurred',
          type: 'error',
          isLoading: false,
          autoClose: 5000,
        });
      }
    },
  }), [selectedUsers.length, isDarkMode, updateUser]);

  const bulkToggleStatusConfig = useMemo(() => ({
    title: 'Toggle User Status',
    message: `Enable or disable ${selectedUsers.length} user(s)?`,
    icon: UserGroupIcon,
    iconColor: isDarkMode ? '#FBBF24' : '#F59E0B',
    iconBgColor: isDarkMode ? '#78350F' : '#FEF3C7',
    itemLabel: 'Selected Users',
    itemUnit: 'user(s)',
    dropdownLabel: 'User Status',
    dropdownPlaceholder: 'Select status',
    showDropdown: true,
    requireSelection: true,
    cancelValue: null,
    options: [
      { value: 'enable', label: 'Enable users' },
      { value: 'disable', label: 'Disable users' },
    ],
    buttonText: 'Update Status',
    buttonColor: 'yellow',
    processingText: 'Updating...',
    onAction: async (userIds, selectedValue) => {
      if (!selectedValue) return;

      const isActive = selectedValue === 'enable';
      const loadingToast = toast.loading(`${isActive ? 'Enabling' : 'Disabling'} users...`);

      try {
        const promises = userIds.map(id =>
          updateUser({ id, is_user_enabled: isActive }).unwrap()
        );
        const results = await Promise.allSettled(promises);

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;

        if (successCount && !failCount) {
          toast.update(loadingToast, {
            render: `Successfully ${isActive ? 'enabled' : 'disabled'} ${successCount} user(s)`,
            type: 'success',
            isLoading: false,
            autoClose: 3000,
          });
        } else if (successCount && failCount) {
          toast.update(loadingToast, {
            render: `Updated ${successCount} user(s), ${failCount} failed`,
            type: 'warning',
            isLoading: false,
            autoClose: 5000,
          });
        } else {
          toast.update(loadingToast, {
            render: `Failed to update ${failCount} user(s)`,
            type: 'error',
            isLoading: false,
            autoClose: 5000,
          });
        }
      } catch (error) {
        toast.update(loadingToast, {
          render: 'An error occurred',
          type: 'error',
          isLoading: false,
          autoClose: 5000,
        });
      }
    },
  }), [selectedUsers.length, isDarkMode, updateUser]);

  // Determine which config to use
  const getCurrentConfig = () => {
    switch (currentBulkAction) {
      case 'DELETE_USERS':
        return bulkDeleteConfig;
      case 'EDIT_ROLES':
        return bulkEditRolesConfig;
      case 'ENABLE_EMAIL':
        return bulkOverrideEmailConfig;
      case 'TOGGLE_STATUS':
        return bulkToggleStatusConfig;
      default:
        return null;
    }
  };

  // Password Reset Button Click
  const handlePasswordReset = (userToReset) => {
    setSelectedUser(userToReset);
    setPasswordResetData({
      email: userToReset?.email || "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
    setConfirmPasswordTouched(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowPasswordResetModal(true);
  };

  // Helper function to clear errors on typing
  const handlePasswordResetChange = (field, value) => {
    setPasswordResetData({
      ...passwordResetData,
      [field]: value,
    });

    // Clear errors when user types
    if (passwordErrors[field]) {
      setPasswordErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        // Also clear 'password' key if typing in newPassword
        if (field === 'newPassword') {
          delete newErrors.password;
        }
        return newErrors;
      });
    }
  };

  // Helper for input styling
  const getPasswordResetInputStyling = (fieldName) => {
    if (passwordErrors[fieldName] || passwordErrors.password) {
      return isDarkMode
        ? 'bg-gray-700 border-red-500 text-white focus:ring-red-500 focus:border-red-500'
        : 'bg-white border-red-500 text-gray-900 focus:ring-red-500 focus:border-red-500';
    }

    return isDarkMode
      ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500';
  };

  //  Password Reset Submit
  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();

    // Only check if passwords match (let backend handle strength validation)
    if (passwordResetData.newPassword !== passwordResetData.confirmPassword) {
      setPasswordErrors({ confirmPassword: "Passwords do not match!" });
      return;
    }

    const loadingToast = toast.loading("Resetting password...");

    try {
      const response = await updateUser({
        id: selectedUser?.id,
        password: passwordResetData.newPassword,
      }).unwrap();

      console.log("Backend response:", response);

      // Check for validation errors in success response
      if (response.success === false && response.failed_updates?.length > 0) {
        const failedUpdate = response.failed_updates[0];

        if (failedUpdate.errors) {
          let fieldErrors = {};

          Object.keys(failedUpdate.errors).forEach(field => {
            if (Array.isArray(failedUpdate.errors[field])) {
              const errorMessage = failedUpdate.errors[field].join(' ');
              fieldErrors[field] = errorMessage;
            }
          });

          if (Object.keys(fieldErrors).length > 0) {
            setPasswordErrors(fieldErrors);
            toast.update(loadingToast, {
              render: "Please fix the validation errors",
              type: "error",
              isLoading: false,
              autoClose: 3000,
            });
            return;
          }
        }
      }

      const updatedUser = response?.results?.[0] || response?.successful_updates?.[0];
      const message = updatedUser
        ? `Password reset successfully for "${updatedUser.email}"!`
        : `Password reset successful`;

      toast.update(loadingToast, {
        render: message,
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });

      setShowPasswordResetModal(false);
      setSelectedUser(null);
      setPasswordResetData({
        email: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
      setConfirmPasswordTouched(false);

    } catch (error) {
      console.error("Password reset error:", error);

      let fieldErrors = {};
      const errorData = error?.data;

      if (errorData) {
        // Handle bulk update format
        if (errorData.failed_updates && Array.isArray(errorData.failed_updates)) {
          const failedUpdate = errorData.failed_updates[0];

          if (failedUpdate?.errors) {
            Object.keys(failedUpdate.errors).forEach(field => {
              if (Array.isArray(failedUpdate.errors[field])) {
                const errorMessage = failedUpdate.errors[field].join(' ');
                fieldErrors[field] = errorMessage;
              }
            });
          }
        }

        // Handle standard VALIDATION_ERROR format
        if (errorData.code === "VALIDATION_ERROR" && errorData.errors) {
          Object.keys(errorData.errors).forEach(field => {
            if (Array.isArray(errorData.errors[field])) {
              fieldErrors[field] = errorData.errors[field].join(' ');
            }
          });
        }

        // Handle plain object errors
        if (Object.keys(fieldErrors).length === 0 && typeof errorData === 'object') {
          Object.keys(errorData).forEach(field => {
            if (Array.isArray(errorData[field])) {
              fieldErrors[field] = errorData[field].join(' ');
            } else if (typeof errorData[field] === 'string') {
              fieldErrors[field] = errorData[field];
            }
          });
        }

        if (Object.keys(fieldErrors).length > 0) {
          setPasswordErrors(fieldErrors);
          toast.update(loadingToast, {
            render: "Please fix the validation errors",
            type: "error",
            isLoading: false,
            autoClose: 3000,
          });
          return;
        }
      }

      // Fallback generic error
      let errorMessage = "Unknown error occurred";
      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.data?.error) {
        errorMessage = error.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.update(loadingToast, {
        render: `Failed to reset password: ${errorMessage}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  // Handle checkbox selection
  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Handle select all
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const selectableUsers = filteredUsers.filter(rowUser => rowUser.id !== user?.id);
      setSelectedUsers(selectableUsers.map(rowUser => rowUser.id));
    } else {
      setSelectedUsers([]);
    }
  };

  // BULK ACTION HANDLERS
  const handleBulkEditRoles = () => {
    setIsActionsDropdownOpen(false);
    setCurrentBulkAction('EDIT_ROLES');
    setShowBulkActionModal(true);
  };

  const handleBulkEnableEmail = () => {
    setIsActionsDropdownOpen(false);
    setCurrentBulkAction('ENABLE_EMAIL');
    setShowBulkActionModal(true);
  };

  const handleBulkDeleteUsers = () => {
    setIsActionsDropdownOpen(false);
    setCurrentBulkAction('DELETE_USERS');
    setShowBulkActionModal(true);
  };

  const handleBulkToggleStatus = () => {
    setIsActionsDropdownOpen(false);
    setCurrentBulkAction('TOGGLE_STATUS');
    setShowBulkActionModal(true);
  };

  const handleBulkActionSuccess = () => {
    setSelectedUsers([]);
    setShowBulkActionModal(false);
    setCurrentBulkAction(null);
    refetch();
  };

  // Close actions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(event.target)) {
        setIsActionsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

    const matchingRole = editRoleOptions.find(
      role => role.label === userToEdit?.role_name
    );

    const initialData = {
      username: userToEdit?.username || "",
      email: userToEdit?.email || "",
      role: matchingRole?.value || "",
      is_user_enabled: userToEdit?.is_user_enabled ?? false,
      is_email_override: !(userToEdit?.is_email_override ?? true),
    };

    setEditFormData(initialData);
    setOriginalUserData(initialData);
    setModifiedFields(new Set());
    setShowEditModal(true);
  };

  // Helper to track field changes
  const handleFieldChange = (fieldName, value) => {
    setEditFormData(prev => ({ ...prev, [fieldName]: value }));

    // Mark field as modified if value differs from original
    if (value !== originalUserData[fieldName]) {
      setModifiedFields(prev => new Set(prev).add(fieldName));
    } else {
      // Remove from modified if user reverted to original value
      setModifiedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldName);
        return newSet;
      });
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    // If nothing changed, don't make API call
    if (modifiedFields.size === 0) {
      toast.info("No changes detected");
      setShowEditModal(false);
      return;
    }

    // Build payload with only modified fields
    const payload = {
      id: selectedUser?.id,
    };

    modifiedFields.forEach(fieldName => {
      if (fieldName === 'is_email_override') {
        payload[fieldName] = !editFormData[fieldName];
      } else {
        payload[fieldName] = editFormData[fieldName];
      }
    });

    console.log("Update payload:", payload);
    console.log("Modified fields:", Array.from(modifiedFields));

    const loadingToast = toast.loading("Updating user...");

    try {
      const response = await updateUser(payload).unwrap();

      console.log("Backend update response:", response);

      const updatedUser = response?.results?.[0];
      const backendMessage = updatedUser?.message;

      toast.update(loadingToast, {
        render: backendMessage,
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });

      setShowEditModal(false);
      setSelectedUser(null);
      setEditFormData({});
      setOriginalUserData({});
      setModifiedFields(new Set());
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
              fieldErrors.push(`${field}: ${error.data[field].join(", ")}`);
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
      const response = await deleteUser(selectedUser?.id).unwrap();

      toast.update(loadingToast, {
        render: response?.message,
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
              className={`p-2 rounded-lg transition-colors ${isDarkMode
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
            className={`p-2 rounded-lg transition-colors ${isDarkMode
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
          {/* Actions Dropdown */}
          <div className="relative" ref={actionsDropdownRef}>
            <button
              onClick={() => setIsActionsDropdownOpen(!isActionsDropdownOpen)}
              disabled={selectedUsers.length === 0}
              className={`flex items-center justify-between px-3 py-1.5 text-xs border rounded-md cursor-pointer min-w-[120px] transition-all duration-200 hover:shadow-md
                ${selectedUsers.length === 0
                  ? isDarkMode
                    ? "bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed opacity-50"
                    : "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed opacity-50"
                  : isDarkMode
                    ? "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-650 hover:border-gray-500"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                }
                ${isActionsDropdownOpen && selectedUsers.length > 0 ? "ring-2 ring-blue-500 ring-opacity-50" : ""}
              `}
              title={selectedUsers.length === 0 ? "Select users to perform actions" : "Bulk actions"}
            >
              <div className="flex items-center">
                <span>Actions</span>
              </div>
              <ChevronDown
                className={`w-3 h-3 ml-1 transition-transform duration-200 ${isActionsDropdownOpen ? "rotate-180" : "rotate-0"
                  }`}
              />
            </button>

            {/* Dropdown Menu */}
            <div
              className={`absolute left-0 top-full mt-1 w-48 rounded-md shadow-lg border z-50 transition-all duration-200 origin-top
                ${isDarkMode
                  ? "bg-gray-700 border-gray-600"
                  : "bg-white border-gray-200"
                }
                ${isActionsDropdownOpen && selectedUsers.length > 0
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                }
              `}
            >
              <div className="py-1">
                <button
                  onClick={handleBulkEditRoles}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors duration-150
                    ${isDarkMode
                      ? "text-gray-200 hover:bg-gray-600"
                      : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  Edit Roles
                </button>

                <button
                  onClick={handleBulkEnableEmail}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors duration-150
                    ${isDarkMode
                      ? "text-gray-200 hover:bg-gray-600"
                      : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  Enable Email Verification
                </button>

                <button
                  onClick={handleBulkToggleStatus}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors duration-150
                    ${isDarkMode
                      ? "text-gray-200 hover:bg-gray-600"
                      : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  Enable/Disable Users
                </button>

                <div className={`border-t ${isDarkMode ? "border-gray-600" : "border-gray-200"}`} />

                <button
                  onClick={handleBulkDeleteUsers}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors duration-150
                    ${isDarkMode
                      ? "text-red-400 hover:bg-red-900/20"
                      : "text-red-600 hover:bg-red-50"
                    }`}
                >
                  Delete Users
                </button>
              </div>
            </div>
          </div>

          <div className="relative flex-1 sm:flex-none">
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
                    className="w-[10%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        selectedUsers.length > 0 &&
                        selectedUsers.length === filteredUsers.filter(rowUser => rowUser.id !== user?.id).length &&
                        filteredUsers.filter(rowUser => rowUser.id !== user?.id).length > 0
                      }
                      onChange={handleSelectAll}
                      className={`w-4 h-4 cursor-pointer rounded border ${isDarkMode
                        ? "border-gray-500 text-blue-400 accent-blue-500"
                        : "border-gray-300 text-blue-600 accent-blue-600"
                        }`}
                    />
                  </th>

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
                    {/*Checkbox Column */}
                    <td className="w-[10%] px-3 py-2 text-left align-middle">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(rowUser.id)}
                        onChange={() => handleUserSelect(rowUser.id)}
                        disabled={rowUser?.id === user?.id}
                        className={`w-4 h-4 cursor-pointer rounded border ${rowUser?.id === user?.id
                          ? "cursor-not-allowed opacity-50"
                          : ""
                          } ${isDarkMode
                            ? "border-gray-500 text-blue-400 accent-blue-500"
                            : "border-gray-300 text-blue-600 accent-blue-600"
                          }`}
                        title={rowUser?.id === user?.id ? "Cannot select your own account" : ""}
                      />
                    </td>

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
                        <div className="flex items-center gap-1">
                          <div
                            className="text-xs truncate"
                            style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                            title={rowUser?.email}
                          >
                            {rowUser?.email || "N/A"}
                          </div>
                          {/* Verified Badge */}
                          {rowUser?.is_email_verified && (
                            <CheckBadgeIcon
                              className="w-4 h-4 flex-shrink-0"
                              style={{ color: isDarkMode ? "#34D399" : "#10B981" }}
                              title="Email Verified"
                            />
                          )}
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
                            rowUser?.is_user_enabled
                          )}`}
                        >
                          {rowUser?.is_user_enabled
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

                    {/* UPDATED: Actions Column with Password Reset Button */}
                    <td className="w-[8%] px-2 py-2 text-sm font-medium">
                      <div className="flex items-center justify-center space-x-1">
                        {/* Check if this row is the current logged-in user */}
                        {rowUser?.id === user?.id ? (
                          /* Show disabled buttons for current user */
                          <>
                            <button
                              disabled
                              className={`p-1 rounded cursor-not-allowed opacity-50 ${isDarkMode ? "text-gray-600" : "text-gray-400"
                                }`}
                              title="Cannot edit your own account"
                            >
                              <PencilIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled
                              className={`p-1 rounded cursor-not-allowed opacity-50 ${isDarkMode ? "text-gray-600" : "text-gray-400"
                                }`}
                              title="Cannot reset your own password here"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled
                              className={`p-1 rounded cursor-not-allowed opacity-50 ${isDarkMode ? "text-gray-600" : "text-gray-400"
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
                                className={`p-1 rounded transition-colors ${isDarkMode
                                  ? "text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                  : "text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                                  }`}
                                title="Edit User"
                              >
                                <PencilIcon className="w-3.5 h-3.5" />
                              </button>
                            </RenderIfAllowed>

                            {/* UPDATED: Password Reset Button */}
                            <RenderIfAllowed module="users_management" action="update">
                              <button
                                onClick={() => handlePasswordReset(rowUser)}
                                className={`p-1 rounded transition-colors ${isDarkMode
                                  ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20"
                                  : "text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50"
                                  }`}
                                title="Reset Password"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                            </RenderIfAllowed>

                            <RenderIfAllowed module="users_management" action="delete">
                              <button
                                onClick={() => handleDeleteUser(rowUser)}
                                className={`p-1 rounded transition-colors ${isDarkMode
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
          onClick={() => {
            setShowEditModal(false);
            setModifiedFields(new Set());
          }}
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
                onClick={() => {
                  setShowEditModal(false);
                  setModifiedFields(new Set());
                }}
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
                  {/* Username Input */}
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
                      onChange={(e) => handleFieldChange('username', e.target.value)} 
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                        }`}
                      required
                    />
                  </div>

                  {/* Email Input */}
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
                      onChange={(e) => handleFieldChange('email', e.target.value)} 
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                        }`}
                      required
                    />
                  </div>

                  {/* Role Dropdown */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: isDarkMode ? "#D1D5DB" : "#374151" }}
                    >
                      Role
                    </label>
                    <EditRoleDropdown
                      roleOptions={editRoleOptions}
                      selectedRole={editFormData.role}
                      setSelectedRole={(role) => handleFieldChange('role', role)} 
                      isDarkMode={isDarkMode}
                      isLoading={rolesLoading}
                    />
                    {rolesError && (
                      <p className="mt-0.5 text-xs text-red-600">
                        Error loading roles. Please try again.
                      </p>
                    )}
                  </div>

                  {/* Status Checkboxes */}
                  <div
                    className={`p-3 rounded-lg border ${isDarkMode
                        ? "bg-gray-700/50 border-gray-600"
                        : "bg-gray-50 border-gray-200"
                      }`}
                  >
                    <div className="space-y-2">
                      {/* Active User Checkbox */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_user_enabled"
                          checked={editFormData.is_user_enabled || false}
                          onChange={(e) => handleFieldChange('is_user_enabled', e.target.checked)} 
                          className={`w-4 h-4 rounded border transition-colors cursor-pointer ${isDarkMode
                              ? "border-gray-500 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-700"
                              : "border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-white"
                            }`}
                        />
                        <label
                          htmlFor="is_user_enabled"
                          className="ml-2 text-sm font-medium cursor-pointer"
                          style={{ color: isDarkMode ? "#D1D5DB" : "#374151" }}
                        >
                          Active User
                        </label>
                      </div>

                      {/* Email Enabled Checkbox */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_email_override"
                          checked={editFormData.is_email_override || false}
                          onChange={(e) => handleFieldChange('is_email_override', e.target.checked)}
                          className={`w-4 h-4 rounded border transition-colors cursor-pointer ${isDarkMode
                              ? "border-gray-500 text-green-500 focus:ring-green-500 focus:ring-offset-gray-700"
                              : "border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-white"
                            }`}
                        />
                        <label
                          htmlFor="is_email_override"
                          className="ml-2 text-sm font-medium cursor-pointer"
                          style={{ color: isDarkMode ? "#D1D5DB" : "#374151" }}
                        >
                          Enable Email Verification
                        </label>
                      </div>
                    </div>

                    <p
                      className="mt-2 text-xs"
                      style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                    >
                      Control user account status and email verification
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setModifiedFields(new Set());
                      }}
                      className={`px-4 py-2 rounded-lg ${isDarkMode
                          ? "text-gray-300 bg-gray-600 hover:bg-gray-500"
                          : "text-gray-700 bg-gray-200 hover:bg-gray-300"
                        }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={rolesLoading || modifiedFields.size === 0} 
                      className="px-4 py-2 bg-[#6366f1] text-white rounded-lg hover:bg-[#6366f1]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Update User {modifiedFields.size > 0 && `(${modifiedFields.size})`}
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
                className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors ${isDarkMode
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

      {/* Password Reset Modal */}
      {showPasswordResetModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.1)" }}
          onClick={() => {
            setShowPasswordResetModal(false);
            setPasswordErrors({});
            setConfirmPasswordTouched(false);
          }}
        >
          <div
            className="rounded-xl p-6 max-w-md w-full relative shadow-2xl border mx-4"
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
                onClick={() => {
                  setShowPasswordResetModal(false);
                  setPasswordErrors({});
                  setConfirmPasswordTouched(false);
                }}
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
                  Reset Password
                </h3>

                <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                  {/* Email (Read-only) */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{
                        color: isDarkMode ? "#D1D5DB" : "#374151",
                      }}
                    >
                      User Email
                    </label>
                    <input
                      type="email"
                      value={passwordResetData.email}
                      readOnly
                      className={`w-full px-3 py-2 border rounded-lg cursor-not-allowed opacity-70 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-gray-400"
                          : "bg-gray-100 border-gray-300 text-gray-600"
                      }`}
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{
                        color: isDarkMode ? "#D1D5DB" : "#374151",
                      }}
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordResetData.newPassword}
                        onChange={(e) => handlePasswordResetChange('newPassword', e.target.value)}
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 ${getPasswordResetInputStyling('newPassword')}`}
                        placeholder="Enter new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
                        tabIndex={-1}
                      >
                        {showNewPassword ? (
                          <EyeSlashIcon
                            className="w-5 h-5"
                            style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                          />
                        ) : (
                          <EyeIcon
                            className="w-5 h-5"
                            style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                          />
                        )}
                      </button>
                    </div>
                    {/* Show backend password errors */}
                    {passwordErrors.password && (
                      <p className="text-xs mt-1 text-red-500">{passwordErrors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{
                        color: isDarkMode ? "#D1D5DB" : "#374151",
                      }}
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordResetData.confirmPassword}
                        onChange={(e) => handlePasswordResetChange('confirmPassword', e.target.value)}
                        onBlur={() => setConfirmPasswordTouched(true)}
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 ${getPasswordResetInputStyling('confirmPassword')}`}
                        placeholder="Confirm new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon
                            className="w-5 h-5"
                            style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                          />
                        ) : (
                          <EyeIcon
                            className="w-5 h-5"
                            style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                          />
                        )}
                      </button>
                    </div>

                    {/* Password Match Indicator */}
                    {confirmPasswordTouched && passwordResetData.newPassword && passwordResetData.confirmPassword && (
                      <p
                        className="text-xs mt-1"
                        style={{
                          color:
                            passwordResetData.newPassword === passwordResetData.confirmPassword
                              ? "#10B981"
                              : "#EF4444",
                        }}
                      >
                        {passwordResetData.newPassword === passwordResetData.confirmPassword
                          ? "✓ Passwords match"
                          : "✗ Passwords do not match"}
                      </p>
                    )}

                    {passwordErrors.confirmPassword && (
                      <p className="text-xs mt-1 text-red-500">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordResetModal(false);
                        setPasswordErrors({});
                        setConfirmPasswordTouched(false);
                      }}
                      className={`px-4 py-2 rounded-lg ${
                        isDarkMode
                          ? "text-gray-300 bg-gray-600 hover:bg-gray-500"
                          : "text-gray-700 bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={
                        !passwordResetData.newPassword ||
                        !passwordResetData.confirmPassword ||
                        passwordResetData.newPassword !== passwordResetData.confirmPassword
                      }
                      className="px-4 py-2 bg-[#6366f1] text-white rounded-lg hover:bg-[#6366f1]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reset Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*BULK ACTION MODAL HERE */}
      <BulkActionModal
        show={showBulkActionModal}
        onHide={() => {
          setShowBulkActionModal(false);
          setCurrentBulkAction(null);
        }}
        selectedItems={selectedUsers}
        isDarkMode={isDarkMode}
        config={getCurrentConfig()}
        onSuccess={handleBulkActionSuccess}
      />
    </>
  );
};

export default UserListTab;
