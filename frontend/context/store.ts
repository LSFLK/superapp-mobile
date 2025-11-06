// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import secureStorage from "@/utils/secureStorage";
import appReducer from "./slices/appSlice";
import authReducer from "./slices/authSlice";
import userConfigReducer from "./slices/userConfigSlice";
import versionReducer from "./slices/versionSlice";
import userInfoReducer from "./slices/userInfoSlice";

// Use secure storage for sensitive data (auth, userConfig)
const authPersistConfig = {
  key: "auth",
  storage: secureStorage,
  whitelist: ["accessToken", "refreshToken", "idToken", "expiresAt", "email"],
};

// Apps and user info are read-only display data - can use AsyncStorage
const appsPersistConfig = {
  key: "apps",
  storage: AsyncStorage,
  whitelist: ["installedApps"],
};

const userConfigPersistConfig = {
  key: "user-config",
  storage: secureStorage,
  whitelist: ["configurations"],
};

const userInfoPersistConfig = {
  key: "user-info",
  storage: AsyncStorage,
  whitelist: ["userInfo"],
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
