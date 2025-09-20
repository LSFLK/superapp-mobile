import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  StyleSheet,
  Alert,
  Image,
  ScrollView
} from "react-native";
import React, { useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/context/store";
import { Colors } from "@/constants/Colors";
import Constants from "expo-constants";
import ProfileListItem from "@/components/ProfileListItem";
import Avatar from "@/components/Avatar";
// import { useTrackActiveScreen } from "@/hooks/useTrackActiveScreen";
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

  // useTrackActiveScreen(ScreenPaths.PROFILE);

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
      <ScrollView style={{}} scrollEnabled={true}>
      {userInfo ? (
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your account settings</Text>
          </View>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarWrapper}>
              {getAvatarUri() ? (
                <Image
                  source={{ uri: getAvatarUri() }}
                  style={styles.avatar}
                />
              ) : (
                <Avatar
                  initials={`${userInfo.firstName?.charAt(0) || ''}${userInfo.lastName?.charAt(0) || ''}`}
                  size={120}
                />
              )}
            </View>

            <Text style={styles.userName}>
              {`${userInfo.firstName} ${userInfo.lastName}`}
            </Text>
            <Text style={styles.userEmail}>
              {userInfo.workEmail}
            </Text>
          </View>

          {/* Profile Details */}
          <View style={styles.detailsContainer}>
            <ProfileListItem
              icon="person-outline"
              title="Full Name"
              value={`${userInfo.firstName} ${userInfo.lastName}`}
            />

            <ProfileListItem
              icon="mail-outline"
              title="Work Email"
              value={userInfo.workEmail}
            />

            {userInfo.department && (
              <ProfileListItem
                icon="business-outline"
                title="Department"
                value={userInfo.department}
              />
            )}

            {userInfo.employeeID && (
              <ProfileListItem
                icon="id-card-outline"
                title="Employee ID"
                value={userInfo.employeeID}
              />
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <View style={styles.logoutRow}>
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color="#FFFFFF"
                  style={styles.logoutIcon}
                />
                <Text style={styles.logoutText}>Sign Out</Text>
              </View>
            </TouchableOpacity>
                    {/* Version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>version {version}</Text>
          </View>
        </View>
          </View>

) : (
  <View style={styles.signInContainer}>
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <SignInMessage />
            </View>
          </View>
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>version {version}</Text>
          </View>
        </View>
      )}

      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const createStyles = (colorScheme: "light" | "dark") =>
  StyleSheet.create({
    container: {
      marginTop:10,
      flex: 1,
      backgroundColor: Colors[colorScheme].primaryBackgroundColor,
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 40,
    },
    header: {
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme].ternaryBackgroundColor,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: '700',
      color: Colors[colorScheme].primaryTextColor,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 16,
      color: Colors[colorScheme].secondaryTextColor,
    },
    profileCard: {
      backgroundColor: Colors[colorScheme].secondaryBackgroundColor,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginBottom: 24,
    
    },
    avatarWrapper: {
      marginBottom: 16,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    userName: {
      fontSize: 24,
      fontWeight: '600',
      color: Colors[colorScheme].primaryTextColor,
      marginBottom: 4,
      textAlign: 'center',
    },
    userEmail: {
      fontSize: 16,
      color: Colors[colorScheme].secondaryTextColor,
      textAlign: 'center',
    },
    detailsContainer: {
      backgroundColor: Colors[colorScheme].secondaryBackgroundColor,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 20,
    },
    actionsContainer: {
      marginBottom: 24,
    },
    logoutButton: {
      backgroundColor: '#E53E3E',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      shadowColor: '#ff0000ff',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 10,
    },
    logoutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoutIcon: {
      marginRight: 8,
    },
    logoutText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    versionContainer: {
      paddingTop:15,
      paddingBottom: 10,
      alignItems: 'center',
    },
    versionText: {
      fontSize: 14,
      color: Colors[colorScheme].secondaryTextColor,
    },
    signInContainer: {
      flex: 1,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      margin: 20,
      borderRadius: 20,
      padding: 35,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
  });