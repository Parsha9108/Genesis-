import { createSlice } from '@reduxjs/toolkit'

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
        updatePermission: (state, action) => {
            
        }
    }
});

