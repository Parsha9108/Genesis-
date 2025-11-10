import { createSlice } from '@reduxjs/toolkit'

// {                                                                                                                                                              
//     rbac: { create: false, read: false, update: false, delete: false },                                                                                          
//     users_management: { create: false, read: false, update: false, delete: false },                                                                                                                                                                                                                       
//     monitoring: { create: false, read: false, update: false, delete: false }                                                                                   
// } 

const module_names = [
    ['rbac', 'Roles'],
    ['users_management', 'Users'],
    ['monitoring', 'Monitoring'],
    ['custom_groups', 'Custom Groups'],
];

const MODULE_NAME_MAP = Object.fromEntries(module_names);

var initialState_modules = {}

for(let module of module_names){
    initialState_modules[module[0]] = {
        name: module[1],
        create: false,
        read: false,
        update: false,
        delete: false
    };
}

export const userModPermSlice = createSlice({
    name: 'userModPerm',
    initialState: initialState_modules,

    reducers: {
        setPermissions: (state, action) => {
            // ADD NAMES if missing from API response
            const permissionsWithNames = {};
            
            Object.keys(action.payload).forEach((moduleKey) => {
                const moduleData = action.payload[moduleKey];
                
                permissionsWithNames[moduleKey] = {
                    name: moduleData?.name || MODULE_NAME_MAP[moduleKey] || moduleKey,
                    create: moduleData?.create ?? false,
                    read: moduleData?.read ?? false,
                    update: moduleData?.update ?? false,
                    delete: moduleData?.delete ?? false,
                };
            });
            
            return permissionsWithNames;
        },
        
        updatePermissions: (state, action) => {
            const {module, newPermission} = action.payload;

            if (state.hasOwnProperty(module)){
                state[module] = {
                    name: state[module].name || MODULE_NAME_MAP[module] || module,
                    ...newPermission,
                };
            }
        },
        
        resetPermissions: (state) => {
            return initialState_modules;
        },
    }
});

export const { 
  setPermissions, 
  updatePermissions, 
  resetPermissions 
} = userModPermSlice.actions;

export default userModPermSlice.reducer;
