import { createSlice } from '@reduxjs/toolkit';

// {                                                                                                                                                              
//     rbac: { create: false, read: false, update: false, delete: false },                                                                                          
//     users_management: { create: false, read: false, update: false, delete: false },                                                                                                                                                                                                                       
//     monitoring: { create: false, read: false, update: false, delete: false },
//     global_config: { read:false, update:false},                                                                                   
// }

// Modules list
const module_names = [
    ['rbac', 'Roles'],
    ['users_management', 'Users'],
    ['monitoring', 'Monitoring'],
    ['custom_groups', 'Custom Groups'],
    ['global_configuration', 'Global Configuration']
];

// Restricted Modules 
const NO_CREATE_DELETE = ['global_config', 'global_configuration'];

// To map module_key
const MODULE_NAME_MAP = Object.fromEntries(module_names);

let initialState_modules = {};

for (let module of module_names) {
    const key = module[0];
    const displayName = module[1];

    // If module is restricted (no create/delete)
    if (NO_CREATE_DELETE.includes(key)) {
        initialState_modules[key] = {
            name: displayName,
            read: false,
            update: false,
            // delete:false,
        };
    } else {
        // Normal module with full CRUD permissions
        initialState_modules[key] = {
            name: displayName,
            create: false,
            read: false,
            update: false,
            delete: false,
        };
    }
}

export const userModPermSlice = createSlice({
    name: 'userModPerm',
    initialState: initialState_modules,

    reducers: {
        setPermissions: (state, action) => {
            const incoming = action.payload;
            const updatedPermissions = {};

            Object.keys(incoming).forEach((moduleKey) => {
                const moduleData = incoming[moduleKey];
                const name = moduleData?.name || MODULE_NAME_MAP[moduleKey] || moduleKey;

                if (NO_CREATE_DELETE.includes(moduleKey)) {
                    // Restricted module with read & update only
                    updatedPermissions[moduleKey] = {
                        name,
                        read: moduleData?.read ?? false,
                        update: moduleData?.update ?? false,
                        // delete: moduleData?.delete ?? false,
                        
                    };
                } else {
                    // Regular modules with CRUD
                    updatedPermissions[moduleKey] = {
                        name,
                        create: moduleData?.create ?? false,
                        read: moduleData?.read ?? false,
                        update: moduleData?.update ?? false,
                        delete: moduleData?.delete ?? false,
                    };
                }
            });

            return updatedPermissions;
        },

        updatePermissions: (state, action) => {
            const { module, newPermission } = action.payload;

            if (state.hasOwnProperty(module)) {
                const current = state[module];
                const name = current.name || MODULE_NAME_MAP[module] || module;

                if (NO_CREATE_DELETE.includes(module)) {
                    // Only update read/update
                    state[module] = {
                        name,
                        read: newPermission?.read ?? current.read,
                        update: newPermission?.update ?? current.update,
                        // update: newPermission?.delete ?? current.delete,
                    };
                } else {
                    // Update full permissions
                    state[module] = {
                        name,
                        create: newPermission?.create ?? current.create,
                        read: newPermission?.read ?? current.read,
                        update: newPermission?.update ?? current.update,
                        delete: newPermission?.delete ?? current.delete,
                    };
                }
            }
        },

        resetPermissions: () => initialState_modules,
    }
});

export const { 
  setPermissions, 
  updatePermissions, 
  resetPermissions 
} = userModPermSlice.actions;

export default userModPermSlice.reducer;
