import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    XMarkIcon,
    UserGroupIcon,
    TrashIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { ChevronDown } from 'lucide-react';
import { useGetRolesQuery } from '../../redux/roleApiSlice';
import {
    useUpdateUserMutation,
    useDeleteUserMutation,
} from '../../redux/userApiSlice';
import "../index.css";

// BulkActionDropdown component
const BulkActionDropdown = ({
    options,
    selectedValue,
    setSelectedValue,
    isDarkMode,
    disabled = false,
    isLoading = false,
    placeholder = "Select an option"
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => {
        if (!disabled && !isLoading) {
            setIsOpen(!isOpen);
        }
    };

    const handleSelect = (value) => {
        setSelectedValue(value);
        setIsOpen(false);
    };

    const getSelectedLabel = () => {
        const selectedOption = options.find(opt => opt.value === selectedValue);
        return selectedOption ? selectedOption.label : placeholder;
    };

    const getDropdownStyling = () => {
        if (disabled || isLoading) {
            return isDarkMode
                ? 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed';
        }

        return isDarkMode
            ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-650 hover:border-gray-500'
            : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-400';
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={handleToggle}
                disabled={disabled || isLoading}
                className={`flex items-center justify-between w-full px-3 py-1.5 text-sm border rounded-lg cursor-pointer transition-all duration-200 focus:ring-2 focus:ring-blue-500 ${getDropdownStyling()}
          ${isOpen ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
        `}
            >
                <span className={selectedValue ? '' : 'text-gray-500 dark:text-gray-400'}>
                    {isLoading ? 'Loading...' : getSelectedLabel()}
                </span>
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'} ${disabled || isLoading ? 'opacity-50' : ''}`} />
            </button>

            <div
                className={`absolute top-full mt-1 w-full rounded-lg shadow-lg border z-50 transition-all duration-200 origin-top
          ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}
          ${isOpen && !disabled && !isLoading
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                    }
        `}
            >
                <div className="py-0.5 max-h-36 overflow-y-auto custom-scroll">
                    {isLoading ? (
                        <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
                    ) : options.length > 0 ? (
                        options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={`w-full text-left px-3 py-2 text-sm transition-colors duration-150
                  ${selectedValue === option.value
                                        ? 'bg-blue-500 text-white'
                                        : isDarkMode
                                            ? 'text-gray-200 hover:bg-gray-600'
                                            : 'text-gray-900 hover:bg-gray-100'
                                    }`}
                                onClick={() => handleSelect(option.value)}
                            >
                                {option.label}
                            </button>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">No options available</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Action type constants
export const BULK_ACTION_TYPES = {
    EDIT_ROLES: 'edit_roles',
    ENABLE_EMAIL: 'enable_email',
    TOGGLE_STATUS: 'toggle_status',
    DELETE_USERS: 'delete_users',
};

const BulkActionModal = ({
    show,
    onHide,
    actionType,
    selectedUsers = [],
    isDarkMode = false,
    onSuccess
}) => {
    const [selectedValue, setSelectedValue] = useState('');

    // Use existing RTK mutations
    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
    const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

    // Fetch roles from backend
    const { data: rolesData = [], isLoading: rolesLoading } = useGetRolesQuery(undefined, {
        skip: actionType !== BULK_ACTION_TYPES.EDIT_ROLES
    });

    // Transform roles data
    const roleOptions = React.useMemo(() => {
        if (!Array.isArray(rolesData) || rolesData.length === 0) {
            return [];
        }
        return rolesData.map(role => ({
            value: role.uuid,
            label: role.role_name || role.name || 'Unknown Role'
        }));
    }, [rolesData]);

    const yesNoOptions = [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
    ];

    const statusOptions = [
        { value: 'enable', label: 'Enable Users' },
        { value: 'disable', label: 'Disable Users' }
    ];

    const getActionConfig = () => {
        switch (actionType) {
            case BULK_ACTION_TYPES.EDIT_ROLES:
                return {
                    title: 'Edit User Roles',
                    icon: UserGroupIcon,
                    iconColor: isDarkMode ? '#60A5FA' : '#2563EB',
                    message: `You are about to change the role for ${selectedUsers.length} user(s). Please select a new role:`,
                    dropdownLabel: 'New Role',
                    dropdownPlaceholder: 'Select a role',
                    options: roleOptions,
                    isLoading: rolesLoading,
                    applyButtonText: 'Apply Role',
                    applyButtonColor: 'blue',
                    showDropdown: true,
                };

            case BULK_ACTION_TYPES.ENABLE_EMAIL:
                return {
                    title: 'Enable Email Verifications',
                    icon: CheckCircleIcon,
                    iconColor: isDarkMode ? '#34D399' : '#10B981',
                    message: `Do you want to enable email verification for ${selectedUsers.length} user(s)?`,
                    dropdownLabel: 'Enable Email',
                    dropdownPlaceholder: 'Select an option',
                    options: yesNoOptions,
                    isLoading: false,
                    applyButtonText: 'Apply Changes',
                    applyButtonColor: 'green',
                    showDropdown: true,
                };

            case BULK_ACTION_TYPES.TOGGLE_STATUS:
                return {
                    title: 'Enable/Disable Users',
                    icon: CheckCircleIcon,
                    iconColor: isDarkMode ? '#FBBF24' : '#F59E0B',
                    message: `Do you want to enable or disable ${selectedUsers.length} user(s)?`,
                    dropdownLabel: 'User Status',
                    dropdownPlaceholder: 'Select status',
                    options: statusOptions,
                    isLoading: false,
                    applyButtonText: 'Apply Status',
                    applyButtonColor: 'yellow',
                    showDropdown: true,
                };

            case BULK_ACTION_TYPES.DELETE_USERS:
                return {
                    title: 'Delete Users',
                    icon: TrashIcon,
                    iconColor: isDarkMode ? '#F87171' : '#EF4444',
                    message: `Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`,
                    dropdownLabel: 'Confirm Deletion',
                    dropdownPlaceholder: 'Confirm action',
                    options: yesNoOptions,
                    isLoading: false,
                    applyButtonText: 'Delete Users',
                    applyButtonColor: 'red',
                    showDropdown: true,
                };

            default:
                return {
                    title: 'Bulk Action',
                    icon: UserGroupIcon,
                    iconColor: isDarkMode ? '#60A5FA' : '#2563EB',
                    message: 'Please select an action to perform.',
                    showDropdown: false,
                };
        }
    };

    const config = getActionConfig();
    const isLoading = isUpdating || isDeleting;

    useEffect(() => {
        if (!show) {
            setSelectedValue('');
        }
    }, [show, actionType]);

    const handleClose = () => {
        setSelectedValue('');
        onHide();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedValue) {
            toast.error('Please select an option');
            return;
        }

        // For delete action, check if user confirmed
        if (actionType === BULK_ACTION_TYPES.DELETE_USERS && selectedValue !== 'true') {
            handleClose();
            return;
        }

        try {
            let successCount = 0;
            let failCount = 0;
            const errors = [];

            switch (actionType) {
                case BULK_ACTION_TYPES.EDIT_ROLES:
                    // Process each user individually
                    for (const userId of selectedUsers) {
                        try {
                            await updateUser({
                                id: userId,
                                role: selectedValue
                            }).unwrap();
                            successCount++;
                        } catch (err) {
                            failCount++;
                            errors.push(`User ${userId}: ${err?.data?.message || err?.message || 'Failed'}`);
                        }
                    }
                    break;

                case BULK_ACTION_TYPES.ENABLE_EMAIL:
                    // Process each user individually with is_email_enabled
                    for (const userId of selectedUsers) {
                        try {
                            await updateUser({
                                id: userId,
                                is_email_enabled: selectedValue === 'true'
                            }).unwrap();
                            successCount++;
                        } catch (err) {
                            failCount++;
                            errors.push(`User ${userId}: ${err?.data?.message || err?.message || 'Failed'}`);
                        }
                    }
                    break;

                case BULK_ACTION_TYPES.TOGGLE_STATUS:
                    // Process each user individually with is_active
                    for (const userId of selectedUsers) {
                        try {
                            await updateUser({
                                id: userId,
                                is_active: selectedValue === 'enable'
                            }).unwrap();
                            successCount++;
                        } catch (err) {
                            failCount++;
                            errors.push(`User ${userId}: ${err?.data?.message || err?.message || 'Failed'}`);
                        }
                    }
                    break;

                case BULK_ACTION_TYPES.DELETE_USERS:
                    // Process each user deletion individually
                    for (const userId of selectedUsers) {
                        try {
                            await deleteUser({
                                id: userId
                            }).unwrap();
                            successCount++;
                        } catch (err) {
                            failCount++;
                            errors.push(`User ${userId}: ${err?.data?.message || err?.message || 'Failed'}`);
                        }
                    }
                    break;

                default:
                    throw new Error('Invalid action type');
            }

            // Show results
            if (successCount > 0 && failCount === 0) {
                let successMessage = '';
                switch (actionType) {
                    case BULK_ACTION_TYPES.EDIT_ROLES:
                        const roleName = roleOptions.find(r => r.value === selectedValue)?.label;
                        successMessage = `Successfully updated role to "${roleName}" for ${successCount} user(s)`;
                        break;
                    case BULK_ACTION_TYPES.ENABLE_EMAIL:
                        const emailStatus = selectedValue === 'true' ? 'enabled' : 'disabled';
                        successMessage = `Successfully ${emailStatus} email verification for ${successCount} user(s)`;
                        break;
                    case BULK_ACTION_TYPES.TOGGLE_STATUS:
                        const status = selectedValue === 'enable' ? 'enabled' : 'disabled';
                        successMessage = `Successfully ${status} ${successCount} user(s)`;
                        break;
                    case BULK_ACTION_TYPES.DELETE_USERS:
                        successMessage = `Successfully deleted ${successCount} user(s)`;
                        break;
                }
                toast.success(successMessage);
            } else if (successCount > 0 && failCount > 0) {
                toast.warning(`Completed with ${successCount} success(es) and ${failCount} failure(s)`);
                console.error('Bulk action errors:', errors);
            } else {
                toast.error(`All operations failed. ${failCount} error(s)`);
                console.error('Bulk action errors:', errors);
            }

            handleClose();

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Bulk action error:', error);

            let errorMessage = 'Failed to apply changes';

            if (error?.data?.message) {
                errorMessage = error.data.message;
            } else if (error?.data?.error) {
                errorMessage = error.data.error;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        }
    };



    const getButtonColorClasses = () => {
        switch (config.applyButtonColor) {
            case 'red':
                return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
            case 'green':
                return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
            case 'yellow':
                return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
            default:
                return 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500';
        }
    };

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
            onClick={handleClose}
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
                <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>

                <h3
                    className="text-xl font-semibold mb-4 flex items-center"
                    style={{ color: isDarkMode ? '#F1F5F9' : '#1E293B' }}
                >
                    <config.icon
                        className="w-5 h-5 mr-2"
                        style={{ color: config.iconColor }}
                    />
                    {config.title}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div
                        className={`p-3 rounded-lg border ${isDarkMode
                                ? 'bg-gray-700/50 border-gray-600'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                    >
                        <p
                            className="text-sm"
                            style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
                        >
                            {config.message}
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <span
                            className="text-sm font-medium"
                            style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
                        >
                            Selected Users:
                        </span>
                        <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode
                                    ? 'bg-blue-900/30 text-blue-300'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                        >
                            {selectedUsers.length} user(s)
                        </span>
                    </div>

                    {config.showDropdown && (
                        <div>
                            <label
                                className="block text-sm font-medium mb-1"
                                style={{ color: isDarkMode ? '#D1D5DB' : '#374151' }}
                            >
                                {config.dropdownLabel}
                            </label>

                            <BulkActionDropdown
                                options={config.options}
                                selectedValue={selectedValue}
                                setSelectedValue={setSelectedValue}
                                isDarkMode={isDarkMode}
                                isLoading={config.isLoading}
                                placeholder={config.dropdownPlaceholder}
                            />
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-3 border-t" style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className={`inline-flex items-center px-4 py-1.5 font-medium rounded-lg transition-colors ${isDarkMode
                                    ? 'text-gray-300 bg-gray-600 hover:bg-gray-500'
                                    : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isLoading || config.isLoading || !selectedValue}
                            className={`inline-flex items-center px-5 py-1.5 font-medium rounded-lg text-white focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${getButtonColorClasses()}`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 914 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Applying...
                                </>
                            ) : (
                                <>{config.applyButtonText}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BulkActionModal;
