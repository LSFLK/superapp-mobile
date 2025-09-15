import { configureStore, combineReducers } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistStore, persistReducer } from "redux-persist";
import appReducer from "./slices/appSlice";
import authReducer from "./slices/authSlice";
import userConfigReducer from "./slices/userConfigSlice";
import versionReducer from "./slices/versionSlice";
import userInfoReducer from "./slices/userInfoSlice";

const authPersistConfig = {
  key: "auth",
  storage: AsyncStorage,
  whitelist: ["auth"],
};

const appsPersistConfig = {
  key: "apps",
  storage: AsyncStorage,
  whitelist: ["apps"],
};

const userConfigPersistConfig = {
  key: "user-config",
  storage: AsyncStorage,
  whitelist: ["user-config"],
};

const userInfoPersistConfig = {
  key: "user-info",
  storage: AsyncStorage,
  whitelist: ["user-info"],
};

const appReducerCombined = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  apps: persistReducer(appsPersistConfig, appReducer),
  userConfig: persistReducer(userConfigPersistConfig, userConfigReducer),
  version: versionReducer,
  userInfo: persistReducer(userInfoPersistConfig, userInfoReducer),
});

const rootReducer = (
  state: ReturnType<typeof appReducerCombined> | undefined,
  action: any
) => {
  if (action.type === "auth/resetAll") {
    state = undefined;
  }
  return appReducerCombined(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
