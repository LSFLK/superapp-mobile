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

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/context/store";
import { router } from "expo-router";
import { ScreenPaths } from "@/constants/ScreenPaths";
import {
    requestNotificationPermissions,
    getDevicePushToken,
    registerNotificationListeners,
    configureNotificationChannels,
} from "@/services/notificationService";
import {
    setDeviceToken,
    setPermissionGranted,
    setIsRegistered,
    setLastNotification,
} from "@/context/slices/notificationSlice";
import { registerDeviceToken } from "@/services/notificationApiService";
import { performLogout } from "@/utils/performLogout";

/**
 * Component to manage push notifications
 * Handles permission requests, token registration, and notification listeners
 */
function NotificationManager() {
    const dispatch = useDispatch<AppDispatch>();
    const notificationListener = useRef<(() => void) | null>(null);

    const { email } = useSelector((state: RootState) => state.auth);
    const { deviceToken, isRegistered } = useSelector(
        (state: RootState) => state.notification
    );
    const { apps } = useSelector((state: RootState) => state.apps);

    const handleLogout = async () => {
        await dispatch(performLogout()).unwrap();
    };

    // Initialize notifications when user is authenticated
    useEffect(() => {
        if (!email) {
            // User not logged in, skip notification setup
            return;
        }

        const setupNotifications = async () => {
            try {
                // Configure notification channels (Android)
                await configureNotificationChannels();

                // Request permissions
                const hasPermission = await requestNotificationPermissions();
                console.log("Permission granted:", hasPermission);
                dispatch(setPermissionGranted(hasPermission));

                if (!hasPermission) {
                    console.warn("Notification permissions not granted");
                    return;
                }

                // Get device token
                const token = await getDevicePushToken();
                console.log("Device token:", token);
                if (token) {
                    dispatch(setDeviceToken(token));

                    // Register token with backend if not already registered or token changed
                    if (!isRegistered || deviceToken !== token) {
                        const success = await registerDeviceToken(email, token, handleLogout);
                        dispatch(setIsRegistered(success));

                        if (success) {
                            console.log("Device token registered with backend");
                        } else {
                            console.error("Failed to register device token with backend");
                        }
                    }
                } else {
                    console.warn("Failed to get device push token");
                }

                // Set up notification listeners
                const cleanup = registerNotificationListeners(
                    (notification) => {
                        // Handle foreground notification
                        console.log("Foreground notification received:", notification);
                        dispatch(setLastNotification(notification));
                    },
                    (response) => {
                        // Handle notification tap
                        console.log("Notification tapped:", response);
                        const data = response.notification.request.content.data;

                        // Store the notification
                        dispatch(setLastNotification(response.notification));
                        console.log("notification data ", data)
                        // Navigate to microapp if microappId is present
                        if (data?.microappId) {
                            console.log("Navigate to microapp:", data.microappId);
                            const app = apps.find((a) => a.appId === data.microappId);
                            if (app) {
                                router.push({
                                    pathname: ScreenPaths.MICRO_APP,
                                    params: {
                                        webViewUri: app.webViewUri,
                                        appName: app.name,
                                        clientId: app.clientId,
                                        exchangedToken: app.exchangedToken,
                                        appId: app.appId,
                                        displayMode: app.displayMode,
                                    },
                                });
                            } else {
                                console.warn("Microapp not found:", data.microappId);
                            }
                        }
                    }
                );

                notificationListener.current = cleanup;
            } catch (error) {
                console.error("Error setting up notifications:", error);
            }
        };

        setupNotifications();

        // Cleanup listeners on unmount
        return () => {
            if (notificationListener.current) {
                notificationListener.current();
            }
        };
    }, [email, deviceToken, isRegistered, dispatch, apps]);

    return null;
}

export default NotificationManager;
