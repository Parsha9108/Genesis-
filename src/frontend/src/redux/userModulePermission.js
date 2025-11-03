import { createSlice } from '@reduxjs/toolkit'

/*

{                                                                                                                                                              
    rbac: { create: false, read: false, update: false, delete: false },                                                                                          
    users_management: { create: false, read: false, update: false, delete: false },                                                                                                                                                                                                                       
    monitoring: { create: false, read: false, update: false, delete: false }                                                                                   
}   

*/

const module_names = [
    'rbac',
    'users_management',
    'monitoring',
];

var initialState_modules = {}

for(let module of module_names){
    initialState_modules[module] = {};
    for(let perm of ['create', 'read', 'update', 'delete']){
        initialState_modules[module][perm] = false;
    }
}

console.log(initialState_modules);

export const userModPermSlice = createSlice({
    name: 'userModPerm',
    initialState: initialState_modules,

    reducers: {
        setPermissions: (state, action) => {
            // /api/webuser/modules/permissions/all
            // Only when user login
            return action.payload;
        },
        updatePermission: (state, action) => {
            const {module, newPermission} = action.payload;

            if (state.hasOwnProperty(module)){
                state[module] = newPermission;
            }
        },
        resetPermissions: (state) => {
            return initialState_modules;
        },
    }
});

export const { 
  setPermissions, 
  updatePermission, 
  resetPermission 
} = userModPermSlice.actions;

export default userModPermSlice.reducer;

