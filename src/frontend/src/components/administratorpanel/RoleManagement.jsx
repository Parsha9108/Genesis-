import React, { useState, useMemo } from 'react';
import { Users, Plus, X, Save, Edit, Trash2, RefreshCw, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation
} from '../../redux/roleApiSlice';
import '../index.css';
import ConfirmationModal from '../pages/ConfirmationModal';
import RenderIfAllowed from '../Utilities/RenderIfAllowed';

// ====== EXTRACTED ROLEFORM COMPONENT ======
const RoleForm = ({
  isEditMode = false,
  roleData = null,
  modules = [],
  isDarkMode = false,
  isDisabled = false,
  onClose,
  onSubmit,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState({
    roleName: roleData?.role_name || "",
    permissions: roleData?.permissions || {},
  });

  const [errors, setErrors] = useState({});

  const isFieldEnabled = (fieldName) => {
    if (isDisabled) return false;

    switch (fieldName) {
      case 'roleName':
        return true;
      case 'permissions':
        return formData.roleName.trim() !== '';
      default:
        return true;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (!isFieldEnabled(name)) return;

    setFormData({
      ...formData,
      [name]: value,
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handlePermissionToggle = (moduleId, permission) => {
    if (isDisabled) return;

    setFormData((prev) => {
      const modulePermissions = prev.permissions[moduleId] || {};

      let updatedPermissions;

      if (permission === "All") {
        const isAllChecked = !modulePermissions["All"];
        updatedPermissions = {
          All: isAllChecked,
          create: isAllChecked,
          read: isAllChecked,
          update: isAllChecked,
          delete: isAllChecked,
        };
      } else {
        updatedPermissions = {
          ...modulePermissions,
          [permission]: !modulePermissions[permission],
        };

        const allChecked =
          ["create", "read", "update", "delete"].every(
            (perm) => updatedPermissions[perm]
          );
        updatedPermissions["All"] = allChecked;
      }

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [moduleId]: updatedPermissions,
        },
      };
    });

    if (errors.permissions) {
      setErrors({
        ...errors,
        permissions: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.roleName.trim()) {
      newErrors.roleName = 'Role name is required';
    }

    const hasAnyPermission = Object.values(formData.permissions).some(modulePerms =>
      modulePerms.create || modulePerms.read || modulePerms.update || modulePerms.delete
    );

    if (!hasAnyPermission) {
      newErrors.permissions = 'At least one permission must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isDisabled) return;

    if (!validateForm()) return;

    onSubmit(formData);
  };

  const getInputStyling = (fieldName) => {
    const isEnabled = isFieldEnabled(fieldName);

    if (!isEnabled) {
      return isDarkMode
        ? 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed'
        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed';
    }

    if (errors[fieldName]) {
      return isDarkMode
        ? 'border-red-500 bg-gray-600 text-gray-300 placeholder-gray-400 focus:border-red-500 focus:ring-red-500'
        : 'border-red-500 bg-gray-100 text-gray-700 placeholder-gray-500 focus:border-red-500 focus:ring-red-500';
    }

    return isDarkMode
      ? 'border-gray-600 focus:border-blue-500 bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500'
      : 'border-gray-300 focus:border-blue-500 bg-white text-gray-900 focus:ring-blue-500';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="roleName"
          className="block text-sm font-medium mb-1"
          style={{ color: isDarkMode ? "#D1D5DB" : "#374151" }}
        >
          Role Name
        </label>
        <input
          type="text"
          name="roleName"
          value={formData.roleName}
          onChange={handleChange}
          placeholder="Enter role name"
          disabled={isEditMode || !isFieldEnabled('roleName') || isDisabled}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-colors ${getInputStyling('roleName')}`}
        />
        {errors.roleName && (
          <p className="mt-0.5 text-xs text-red-600">{errors.roleName}</p>
        )}
      </div>

      <div>
        <label
          className="block text-sm font-medium mb-1"
          style={{ color: isDarkMode ? "#D1D5DB" : "#374151" }}
        >
          Module Permissions
        </label>
        {errors.permissions && (
          <p className="mt-1 text-xs text-red-600">{errors.permissions}</p>
        )}
      </div>

      <div
        className="rounded-lg border overflow-auto"
        style={{
          borderColor: isDarkMode ? "#4B5563" : "#E5E7EB",
          backgroundColor: isDarkMode ? "#374151" : "#F9FAFB",
          maxHeight: "280px"
        }}
      >
        {modules.length === 0 ? (
          <div
            className="p-4 text-center text-sm"
            style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
          >
            No modules available
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr
                  style={{
                    backgroundColor: isDarkMode ? "#1F2937" : "#F3F4F6",
                    borderBottom: isDarkMode ? "1px solid #4B5563" : "1px solid #E5E7EB",
                    position: "sticky",
                    top: 0,
                    zIndex: 5
                  }}
                >
                  <th
                    className="px-3 py-2 text-left font-semibold"
                    style={{ color: isDarkMode ? "#FFF" : "#111827" }}
                  >
                    Module
                  </th>
                  <th
                    className="px-3 py-2 text-center font-semibold"
                    style={{ color: isDarkMode ? "#FFF" : "#111827" }}
                  >
                    All
                  </th>
                  <th
                    className="px-3 py-2 text-center font-semibold hidden sm:table-cell"
                    style={{ color: isDarkMode ? "#FFF" : "#111827" }}
                  >
                    Create
                  </th>
                  <th
                    className="px-3 py-2 text-center font-semibold hidden sm:table-cell"
                    style={{ color: isDarkMode ? "#FFF" : "#111827" }}
                  >
                    Read
                  </th>
                  <th
                    className="px-3 py-2 text-center font-semibold hidden sm:table-cell"
                    style={{ color: isDarkMode ? "#FFF" : "#111827" }}
                  >
                    Update
                  </th>
                  <th
                    className="px-3 py-2 text-center font-semibold hidden sm:table-cell"
                    style={{ color: isDarkMode ? "#FFF" : "#111827" }}
                  >
                    Delete
                  </th>
                  <th
                    className="px-3 py-2 text-center font-semibold sm:hidden"
                    style={{ color: isDarkMode ? "#FFF" : "#111827" }}
                  >
                    CRUD
                  </th>
                </tr>
              </thead>
              <tbody>
                {modules.map((module) => (
                  <tr
                    key={module.id}
                    style={{
                      borderBottom: isDarkMode ? "1px solid #374151" : "1px solid #E5E7EB"
                    }}
                  >
                    <td
                      className="px-3 py-3 font-medium"
                      style={{ color: isDarkMode ? "#FFF" : "#111827" }}
                    >
                      {module.label}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={formData.permissions[module.id]?.All || false}
                        onChange={() => handlePermissionToggle(module.id, 'All')}
                        disabled={!isFieldEnabled('permissions') || isDisabled}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                      />
                    </td>
                    {['create', 'read', 'update', 'delete'].map((permission) => (
                      <td key={permission} className="px-3 py-3 text-center hidden sm:table-cell">
                        <input
                          type="checkbox"
                          checked={formData.permissions[module.id]?.[permission] || false}
                          onChange={() => handlePermissionToggle(module.id, permission)}
                          disabled={!isFieldEnabled('permissions') || isDisabled}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center sm:hidden">
                      <div className="flex gap-1 justify-center">
                        {['create', 'read', 'update', 'delete'].map((permission) => (
                          <input
                            key={permission}
                            type="checkbox"
                            checked={formData.permissions[module.id]?.[permission] || false}
                            onChange={() => handlePermissionToggle(module.id, permission)}
                            disabled={!isFieldEnabled('permissions') || isDisabled}
                            className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                            title={permission}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className={`px-4 py-2 rounded-lg ${isDarkMode
            ? "text-gray-300 bg-gray-600 hover:bg-gray-500"
            : "text-gray-700 bg-gray-200 hover:bg-gray-300"
            }`}
        >
          {isDisabled ? 'Close' : 'Cancel'}
        </button>

        {!isDisabled && (
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center px-5 py-2 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${isDarkMode
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-offset-gray-800"
              : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-offset-2"
              }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditMode ? 'Update Role' : 'Create Role'}
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
};

// ====== MAIN ROLEMANAGEMENT COMPONENT ======
const RoleManagement = ({ isDarkMode = false }) => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);

  const { data: rolesData = [], isLoading: isLoadingRoles, isError, refetch } = useGetRolesQuery();
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();

  const availableModulesFromRedux = useSelector(state => state.userModPerm) || {};

  // Check if user has update permission for rbac module
  const hasUpdatePermission = availableModulesFromRedux?.rbac?.update === true;

  const roles = rolesData;

  const DEFAULT_ROLES = [
    'Administrator',
    'Administrator (Read-Only)',
    'Global User'
  ];

  // Helper function to check if a role is default
  const isDefaultRole = (roleName) => {
    return DEFAULT_ROLES.some(
      defaultRole => defaultRole.toLowerCase() === roleName.toLowerCase()
    );
  };

  const convertModulesToArray = (modulesObj) => {
    if (!modulesObj || Object.keys(modulesObj).length === 0) return [];

    return Object.keys(modulesObj).map((moduleKey) => ({
      id: moduleKey,
      label: modulesObj[moduleKey]?.name
    }));
  };

  const modules = useMemo(() => {
    return convertModulesToArray(availableModulesFromRedux);
  }, [availableModulesFromRedux]);

  const convertPermissionsToUIFormat = (permissionsArray) => {
    const uiFormat = {};
    permissionsArray.forEach(perm => {
      uiFormat[perm.module] = {
        All: perm.create && perm.read && perm.update && perm.delete,
        create: perm.create,
        read: perm.read,
        update: perm.update,
        delete: perm.delete
      };
    });
    return uiFormat;
  };

  const convertPermissionsToAPIFormat = (uiPermissions) => {
    return Object.entries(uiPermissions)
      .map(([module, perms]) => ({
        module,
        create: perms.create || false,
        read: perms.read || false,
        update: perms.update || false,
        delete: perms.delete || false
      }));
  };

  const handleAddRole = () => {
    setIsEditMode(false);
    setSelectedRole(null);
    setIsViewMode(false);
    setShowModal(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Roles refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh roles');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditRole = (role) => {
    setIsEditMode(true);
    setSelectedRole(role);
    setIsViewMode(false);
    setShowModal(true);
  };

  const handleViewRole = (role) => {
    setIsEditMode(false);
    setSelectedRole(role);
    setIsViewMode(true);
    setShowModal(true);
  };

  const handleDeleteRoleClick = (role) => {
    setRoleToDelete(role);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (roleToDelete) {
      try {
        await deleteRole(roleToDelete.uuid).unwrap();
        toast.success(`Role "${roleToDelete.role_name}" deleted successfully`);
        setShowDeleteConfirm(false);
        setRoleToDelete(null);
      } catch (error) {
        let errorMessage = 'Failed to delete role';
        if (error?.data?.message) {
          errorMessage = error.data.message;
        } else if (error?.data?.error) {
          errorMessage = error.data.error;
        }
        toast.error(errorMessage);
        setShowDeleteConfirm(false);
        setRoleToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setRoleToDelete(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRole(null);
    setIsViewMode(false);
  };

  const handleFormSubmit = async (formData) => {
    try {
      const apiPermissions = convertPermissionsToAPIFormat(formData.permissions);

      if (isEditMode) {
        await updateRole({
          uuid: selectedRole.uuid,
          role_name: formData.roleName,
          permissions: apiPermissions
        }).unwrap();
        toast.success(`Role "${formData.roleName}" updated successfully`);
      } else {
        await createRole({
          role_name: formData.roleName,
          permissions: apiPermissions
        }).unwrap();
        toast.success(`Role "${formData.roleName}" created successfully`);
      }

      handleCloseModal();
    } catch (error) {
      let errorMessage = 'Failed to save role';
      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.data?.error) {
        errorMessage = error.data.error;
      }
      toast.error(errorMessage);
    }
  };

  // Prepare role data for the form
  const prepareRoleData = () => {
    if (!selectedRole) {
      // New role - initialize with empty permissions
      const initialPermissions = {};
      modules.forEach(module => {
        initialPermissions[module.id] = {
          All: false,
          create: false,
          read: false,
          update: false,
          delete: false
        };
      });
      return { role_name: '', permissions: initialPermissions };
    }

    // Existing role - convert and merge permissions
    const uiPermissions = convertPermissionsToUIFormat(selectedRole.permissions);
    const allModulePermissions = {};
    modules.forEach(module => {
      allModulePermissions[module.id] = uiPermissions[module.id] || {
        All: false,
        create: false,
        read: false,
        update: false,
        delete: false
      };
    });

    return {
      role_name: selectedRole.role_name,
      permissions: allModulePermissions
    };
  };

  if (isLoadingRoles) {
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
          Loading roles...
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Header with Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-4">
        <div className="flex items-center space-x-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: isDarkMode ? "#FFF" : "#111827" }}
          >
            Role Management
          </h2>

          <RenderIfAllowed module="rbac" action="create">
            <button
              onClick={handleAddRole}
              className={`p-2 rounded-lg transition-colors ${isDarkMode
                ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40'
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
              title="Add New Role"
              disabled={isCreating || isUpdating || isDeleting || isRefreshing}
            >
              <Plus className="w-5 h-5" />
            </button>
          </RenderIfAllowed>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-lg transition-colors ${isDarkMode
              ? 'bg-green-900/20 text-green-400 hover:bg-green-900/40'
              : 'bg-green-100 text-green-600 hover:bg-green-200'
              } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Refresh Roles"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <span
            className="text-sm font-medium px-2.5 py-0.5 rounded-full"
            style={{
              backgroundColor: isDarkMode ? "#1E40AF" : "#DBEAFE",
              color: isDarkMode ? "#93C5FD" : "#1E40AF",
            }}
          >
            {roles.length} roles
          </span>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-lg shadow border overflow-hidden"
        style={{
          backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
          borderColor: isDarkMode ? "#374151" : "#E5E7EB",
        }}
      >
        {roles.length === 0 ? (
          <div className="text-center py-6">
            <Users
              className="mx-auto h-12 w-12"
              style={{ color: isDarkMode ? "#6B7280" : "#9CA3AF" }}
            />
            <h3
              className="mt-2 text-sm font-medium"
              style={{ color: isDarkMode ? "#FFF" : "#111827" }}
            >
              No roles found
            </h3>
            <p
              className="mt-1 text-sm"
              style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
            >
              No roles available
            </p>
          </div>
        ) : (
          <div className="relative overflow-auto custom-scroll" style={{ maxHeight: "530px" }}>
            <table className="min-w-full table-fixed border-separate border-spacing-0">
              <thead
                className="sticky top-0 z-10"
                style={{ backgroundColor: isDarkMode ? "#111827" : "#F9FAFB" }}
              >
                <tr>
                  <th
                    className="w-[40%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                  >
                    Role Name
                  </th>
                  <th
                    className="w-[40%] px-4 py-3 text-center text-xs font-medium uppercase tracking-wider"
                    style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                  >
                    Description
                  </th>
                  <th
                    className="w-[20%] px-4 py-3 text-center text-xs font-medium uppercase tracking-wider"
                    style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody style={{ backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF" }}>
                {roles.map((role, index) => (
                  <tr
                    key={role.uuid}
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
                    <td className="w-[40%] px-4 py-2 text-left">
                      <div
                        className="text-sm font-medium truncate"
                        style={{ color: isDarkMode ? "#D1D5DB" : "#111827" }}
                        title={role.role_name}
                      >
                        {role.role_name}
                      </div>
                    </td>

                    <td className="w-[40%] px-4 py-2 text-center align-middle">
                      <div
                        className="text-sm truncate flex justify-center items-center h-full"
                        style={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                        title={role.description}
                      >
                        {role.description || "N/A"}
                      </div>
                    </td>
                    <td className="w-[20%] px-4 py-2 text-sm font-medium text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* For DEFAULT roles - ONLY show View button */}
                        {isDefaultRole(role.role_name) ? (
                          <button
                            onClick={() => handleViewRole(role)}
                            className={`p-1 rounded transition-colors ${isDarkMode
                              ? "text-green-400 hover:text-green-300 hover:bg-green-900/20"
                              : "text-green-600 hover:text-green-900 hover:bg-green-50"
                              }`}
                            title="View Role"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <>
                            {/* Edit Button - only if user has UPDATE permission */}
                            <RenderIfAllowed module="rbac" action="update">
                              <button
                                onClick={() => handleEditRole(role)}
                                className={`p-1 rounded transition-colors ${isDarkMode
                                  ? "text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                  : "text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                                  }`}
                                title="Edit Role"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </RenderIfAllowed>

                            {/* View Button - ONLY if user has READ but NOT UPDATE */}
                            {!hasUpdatePermission && (
                              <RenderIfAllowed module="rbac" action="read">
                                <button
                                  onClick={() => handleViewRole(role)}
                                  className={`p-1 rounded transition-colors ${isDarkMode
                                    ? "text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                    : "text-green-600 hover:text-green-900 hover:bg-green-50"
                                    }`}
                                  title="View Role"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </RenderIfAllowed>
                            )}

                            {/* Delete Button - only if user has DELETE permission */}
                            <RenderIfAllowed module="rbac" action="delete">
                              <button
                                onClick={() => handleDeleteRoleClick(role)}
                                className={`p-1 rounded transition-colors ${isDarkMode
                                  ? "text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                  : "text-red-600 hover:text-red-900 hover:bg-red-50"
                                  }`}
                                title="Delete Role"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal with RoleForm Component */}
      {showModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
          onClick={handleCloseModal}
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
                onClick={handleCloseModal}
                className={isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <h3
              className="text-lg leading-6 font-medium mb-4"
              style={{ color: isDarkMode ? "#FFF" : "#111827" }}
            >
              {isViewMode ? 'View Role' : isEditMode ? 'Edit Role' : 'Create New Role'}
            </h3>

            <RoleForm
              isEditMode={isEditMode}
              roleData={prepareRoleData()}
              modules={modules}
              isDarkMode={isDarkMode}
              isDisabled={isViewMode}
              onClose={handleCloseModal}
              onSubmit={handleFormSubmit}
              isSubmitting={isCreating || isUpdating}
            />
          </div>
        </div>
      )}

      <ConfirmationModal
        show={showDeleteConfirm}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${roleToDelete?.role_name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDarkMode={isDarkMode}
      />
    </>
  );
};

export default RoleManagement;
