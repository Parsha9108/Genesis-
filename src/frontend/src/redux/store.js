import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { setupListeners } from '@reduxjs/toolkit/query/react';

// SINGLE UNIFIED API IMPORT
import { apiSlice } from './apiSlice';

// GROUPS API SLICE
import { groupsApiSlice } from './groupsApiSlice';

// FLAG API SLICES
import { storageFlagApi } from './storageFlagApi';
import { portFlagApi } from './networkFlagApi';

// FILTER API SLICES
import { alertFilterApi } from './alertFilterApi';
import { eventLogFilterApi } from './eventLogFilterApi';

// ROLE API SLICE
import { roleApi } from './roleApiSlice';

// Regular reducers
import notificationReducer from './notificationSlice';
import userModPermReducer from './userModulePermission';
import { userApiSlice } from './userApiSlice';
import { permissionApi } from './permissionApiSlice';

// Create app reducer with userModPerm reducer
const appReducer = combineReducers({
  notifications: notificationReducer,
  //Added permissionmodule reducer 
  userModPerm: userModPermReducer,  
  [groupsApiSlice.reducerPath]: groupsApiSlice.reducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
  [userApiSlice.reducerPath]: userApiSlice.reducer,
  [storageFlagApi.reducerPath]: storageFlagApi.reducer,
  [permissionApi.reducerPath]: permissionApi.reducer,
  [portFlagApi.reducerPath]: portFlagApi.reducer,
  // FILTER API REDUCERS
  [alertFilterApi.reducerPath]: alertFilterApi.reducer,
  [eventLogFilterApi.reducerPath]: eventLogFilterApi.reducer,
  // ROLE API REDUCER
  [roleApi.reducerPath]: roleApi.reducer,
});

// ROOT REDUCER WITH AUTO-CLEAR LOGIC
const rootReducer = (state, action) => {
  if (action.type === 'auth/logout' || action.type === 'LOGOUT') {
    console.log('Auto-clearing all Redux state on logout...');
    
    try {
      storage.removeItem('persist:root');
      console.log('Persisted storage cleared');
    } catch (e) {
      console.warn('Failed to remove persist storage:', e);
    }
    
    return appReducer(undefined, action);
  }
  
  if (action.type === 'auth/clearState' || action.type === 'auth/tokenExpired') {
    console.log('Clearing Redux state due to auth error...');
    try {
      storage.removeItem('persist:root');
      console.log('Persisted storage cleared due to auth error');
    } catch (e) {
      console.warn('Failed to remove persist storage on auth error:', e);
    }
    return appReducer(undefined, action);
  }
  
  return appReducer(state, action);
};

const persistConfig = {
  key: 'root',
  storage,
  version: 1,
  whitelist: ['notifications', 'userModPerm'], 
  blacklist: [
    apiSlice.reducerPath,
    groupsApiSlice.reducerPath,
    storageFlagApi.reducerPath, 
    portFlagApi.reducerPath,
    userApiSlice.reducerPath,
    permissionApi.reducerPath,
    alertFilterApi.reducerPath,
    eventLogFilterApi.reducerPath,
    roleApi.reducerPath,
  ],
  
  throttle: 1000,
  serialize: true,
  writeFailHandler: (err) => {
    console.error('Redux persist write failed:', err);
  },
  
  migrate: (state) => {
    console.log('Running Redux persist migration...');
    return Promise.resolve(state);
  },
  
  debug: process.env.NODE_ENV === 'development',
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
          'persist/PURGE',
          'persist/FLUSH',
          'persist/PAUSE',
          'persist/RESTORE',
        ],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: [
          apiSlice.reducerPath,
          groupsApiSlice.reducerPath,
          storageFlagApi.reducerPath,
          portFlagApi.reducerPath,
          userApiSlice.reducerPath,
          permissionApi.reducerPath,
          alertFilterApi.reducerPath,
          eventLogFilterApi.reducerPath,
          roleApi.reducerPath,
        ],
      },
      immutableCheck: {
        ignoredPaths: [
          apiSlice.reducerPath,
          groupsApiSlice.reducerPath,
          storageFlagApi.reducerPath,
          portFlagApi.reducerPath,
          userApiSlice.reducerPath,
          permissionApi.reducerPath,
          alertFilterApi.reducerPath,
          eventLogFilterApi.reducerPath,
          roleApi.reducerPath,
        ],
      },
    })
    .concat(apiSlice.middleware)
    .concat(groupsApiSlice.middleware)
    .concat(userApiSlice.middleware)
    .concat(permissionApi.middleware)
    .concat(storageFlagApi.middleware)
    .concat(portFlagApi.middleware)
    .concat(alertFilterApi.middleware)
    .concat(eventLogFilterApi.middleware)
    .concat(roleApi.middleware),
  
  devTools: process.env.NODE_ENV !== 'production' && {
    name: 'Device Management Store',
    trace: true,
    traceLimit: 25,
  },
});

// Setup listeners for RTK Query
setupListeners(store.dispatch);

export const persistor = persistStore(store, null, () => {
  console.log('Redux store rehydrated successfully');
});

export const clearPersistedState = async () => {
  try {
    await storage.removeItem('persist:root');
    console.log('Manually cleared persisted state');
    return true;
  } catch (error) {
    console.error('Failed to clear persisted state:', error);
    return false;
  }
};

export const getPersistedState = async () => {
  try {
    const persistedState = await storage.getItem('persist:root');
    return persistedState ? JSON.parse(persistedState) : null;
  } catch (error) {
    console.error('Failed to get persisted state:', error);
    return null;
  }
};

if (process.env.NODE_ENV === 'development') {
  store.subscribe(() => {
    const state = store.getState();
    console.log('Store updated:', {
      notifications: state.notifications?.items?.length || 0,
      userModPerm: state.userModPerm,
      apiCaches: {
        main: 'API cache (not persisted)',
        groups: 'Groups API cache (not persisted)',
        storageFlag: 'Storage Flag API cache (not persisted)',
        portFlag: 'Port Flag API cache (not persisted)',
        user: 'User API cache (not persisted)',
        permission: 'Permission API cache (not persisted)',
        alertFilter: 'Alert Filter API cache (not persisted)',
        eventLogFilter: 'Event Log Filter API cache (not persisted)',
        role: 'Role API cache (not persisted)',
      }
    });
  });
}

// Export API instances
export const apis = {
  main: apiSlice,
  groups: groupsApiSlice,
  user: userApiSlice,
  permission: permissionApi,
  storageFlag: storageFlagApi,
  portFlag: portFlagApi,
  alertFilter: alertFilterApi,
  eventLogFilter: eventLogFilterApi,
  role: roleApi,
};

// Utility function to reset all API caches
export const resetAllApiCaches = () => {
  store.dispatch(apiSlice.util.resetApiState());
  store.dispatch(groupsApiSlice.util.resetApiState());
  store.dispatch(userApiSlice.util.resetApiState());
  store.dispatch(permissionApi.util.resetApiState());
  store.dispatch(storageFlagApi.util.resetApiState());
  store.dispatch(portFlagApi.util.resetApiState());
  store.dispatch(alertFilterApi.util.resetApiState());
  store.dispatch(eventLogFilterApi.util.resetApiState());
  store.dispatch(roleApi.util.resetApiState());
  console.log('All API caches reset including role and filter APIs');
};
