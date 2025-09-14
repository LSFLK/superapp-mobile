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
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import React, { useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/context/store";
import { Colors } from "@/constants/Colors";
import Constants from "expo-constants";
import ProfileListItem from "@/components/ProfileListItem";
import Avatar from "@/components/Avatar";
import { useTrackActiveScreen } from "@/hooks/useTrackActiveScreen";
import { ScreenPaths } from "@/constants/ScreenPaths";
import SignInMessage from "@/components/SignInMessage";
import { performLogout } from "@/utils/performLogout";

/**
 * Settings screen displays user profile information when authenticated,
 * otherwise prompts user to sign in. Also allows user to log out.
 */
const SettingsScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const { userInfo } = useSelector((state: RootState) => state.userInfo);
  const colorScheme = useColorScheme();
  const styles = createStyles(colorScheme ?? "light");
  const version = Constants.expoConfig?.version;

  useTrackActiveScreen(ScreenPaths.PROFILE);

  // Get avatar URL from employeeThumbnail
  const getAvatarUri = () => {
    if (userInfo?.employeeThumbnail) {
      return userInfo.employeeThumbnail.split("=s100")[0];
    }
    return "";
  };

  // useEffect(() => {
  //   if (accessToken && !userInfo) {
  //     // dispatch(getUserInfo(logout));

  //     try {
  //       const decoded = jwtDecode<DecodedAccessToken>(accessToken);
  //       setBasicUserInfo({
  //         firstName: decoded.given_name || "",
  //         lastName: decoded.family_name || "",
  //         workEmail: decoded.email || "",
  //         avatarUri: "",
  //       });
  //     } catch (error) {
  //       console.error("Error decoding token", error);
  //     }
  //   }
  // }, [accessToken, dispatch]);

  /**
   * Handles user sign out with confirmation dialog.
   */
  const handleLogout = useCallback(() => {
    Alert.alert(
      "Confirm Sign Out",
      "Are you sure you want to sign out from this app?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await dispatch(performLogout());
          },
        },
      ]
    );
  }, [dispatch]);


  return (
    <SafeAreaView style={styles.container}>
      {/* User info */}
      {userInfo ? (
        <>
          <View style={styles.topContainer}>
            <View style={styles.avatarWrapper}>
              {getAvatarUri() ? (
                <Image
                  source={{ uri: getAvatarUri() }}
                  style={styles.avatar}
                />
              ) : (
                <Avatar
                  initials={`${userInfo.firstName?.charAt(0) || ''}${userInfo.lastName?.charAt(0) || ''}`}
                  size={180}
                />
              )}
            </View>

            <ProfileListItem
              icon="person-outline"
              title="Name"
              value={`${userInfo.firstName} ${userInfo.lastName}`}
            />

            <ProfileListItem
              icon="mail-outline"
              title="Email"
              value={userInfo.workEmail}
            />
          </View>

          <View style={styles.bottomContainer}>
            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>version {version}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.5}
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <View style={styles.logoutRow}>
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color={Colors[colorScheme ?? "light"].primaryBackgroundColor}
                  style={styles.logoutIcon}
                />
                <Text style={styles.logoutText}>Sign Out</Text>
              </View>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.signInContainer}>
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <SignInMessage />
            </View>
          </View>
          <View style={styles.bottomContainer}>
            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>version {version}</Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default SettingsScreen;

const createStyles = (colorScheme: "light" | "dark") =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme].primaryBackgroundColor,
      justifyContent: "space-between",
    },
    signInContainer: {
      flex: 1,
      justifyContent: "space-between",
    },
    overlay: {
      flex: 1,
      backgroundColor: Colors[colorScheme].primaryBackgroundColor,
      justifyContent: "center",
      alignItems: "center",
    },
    modal: {
      backgroundColor: Colors[colorScheme].primaryBackgroundColor,
      padding: 30,
      borderRadius: 16,
      width: "90%",
      alignItems: "center",
    },
    topContainer: {
      marginLeft: 10,
      marginTop: 15,
    },
    avatarWrapper: {
      alignItems: "center",
      marginTop: 24,
      marginBottom: 12,
    },
    avatar: {
      width: 160,
      height: 160,
      borderRadius: 100,
      backgroundColor: Colors[colorScheme].libraryCardBackgroundColor,
    },
    bottomContainer: {
      marginBottom: 80,
    },
    versionContainer: {
      alignItems: "center",
    },
    versionText: {
      color: Colors[colorScheme].text,
    },
    logoutButton: {
      marginVertical: 20,
      marginHorizontal: 60,
      paddingVertical: 12,
      backgroundColor: Colors.companyOrange,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    logoutRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    logoutIcon: {
      marginRight: 8,
    },
    logoutText: {
      fontSize: 16,
      lineHeight: 20,
      color: Colors[colorScheme].primaryBackgroundColor,
      fontWeight: "600",
    },
  });
