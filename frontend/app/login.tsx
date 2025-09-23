import { SafeAreaView, View, Text, StyleSheet, useColorScheme, ActivityIndicator } from "react-native";
import React, { useEffect } from "react";
import Constants from "expo-constants";
import { Colors } from "@/constants/Colors";
import SignInMessage from "@/components/SignInMessage";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/context/store";
import { router } from "expo-router";
import { setUserInfo } from "@/context/slices/userInfoSlice";
import { logout } from "@/services/authService";
import {jwtDecode} from "jwt-decode";

const LoginScreen = () => {
  const colorScheme = useColorScheme() ?? "light";
  const version = Constants.expoConfig?.version;
  const { accessToken, email, idToken } = useSelector((state: RootState) => state.auth);
  const { userInfo } = useSelector((state: RootState) => state.userInfo);
  const dispatch = useDispatch<AppDispatch>();

  /**
   * Effect to handle automatic navigation when user is authenticated
   *
   * This useEffect monitors the accessToken and navigates the user to the main app tabs
   * once authentication is confirmed. The setTimeout ensures navigation occurs after
   * the component has fully mounted, preventing potential navigation conflicts.
   */
  useEffect(() => {
    if (accessToken) {
      // Use setTimeout to ensure navigation happens after component mount
      const timer = setTimeout(() => {
        router.replace("/(tabs)");
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [accessToken , dispatch]);

  /**
   * Effect to decode JWT token and extract user information
   *
   * When a user is authenticated (has accessToken) but userInfo is not yet set,
   * this effect decodes the ID token to extract user details like name and email.
   * The extracted information is then dispatched to the Redux store for global state management.
   * This ensures user data is available throughout the app without redundant API calls.
   */
    useEffect(() => {
      if (accessToken && !userInfo) {
        try {

          const decodedIdToken = jwtDecode<{ 
            email?: string;
            given_name?: string;
            family_name?: string;
          }>(idToken || "");
          
          const userInfoData = {
            firstName: decodedIdToken.given_name || "",
            lastName:  decodedIdToken.family_name || "",
            workEmail: email || "",
            employeeThumbnail: null, // Add required field
          };
          
          // Dispatch to Redux store instead of local state
          dispatch(setUserInfo(userInfoData));
          

          console.log("User info being set to Redux:", userInfoData);
        } catch (error) {
          console.error("Error decoding token", error);
        }
      }
    }, [accessToken, dispatch, userInfo]);

  /**
   * for debugging purposes
   *
   * This useEffect is primarily for development and debugging. It logs whenever
   * the userInfo state in Redux is updated
   */
  useEffect(() => {
    if (userInfo) {
      console.log("User info updated in Redux:", userInfo);
    }
  }, [userInfo]);

  /**
   * Render loading state during authentication and navigation
   *
   * If the user has an accessToken (is authenticated) but hasn't been navigated yet,
   * display a loading indicator with a "Redirecting..." message. This provides
   * visual feedback during the brief delay before navigation occurs.
   */
  if (accessToken) {
    return (
      <SafeAreaView style={styles(colorScheme).container}>
        <View style={styles(colorScheme).loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles(colorScheme).loadingText}>Redirecting...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Render the main login screen UI
   *
   * Displays the welcome interface with app branding, sign-in prompt, and version info.
   * This screen is shown when the user is not authenticated and needs to sign in.
   */
  return (
    <SafeAreaView style={styles(colorScheme).container}>
      <View style={styles(colorScheme).contentContainer}>
        {/* Header */}
        <View style={styles(colorScheme).header}>
          <Text style={styles(colorScheme).welcomeTitle}>Welcome to</Text>
          <Text style={styles(colorScheme).appTitle}>Gov Super App</Text>
          <Text style={styles(colorScheme).subtitle}>Your gateway to government services</Text>
        </View>

        {/* Sign In Card */}
        <View style={styles(colorScheme).signInCard}>
          <SignInMessage />
        </View>

        {/* Version */}
        <View style={styles(colorScheme).versionContainer}>
          <Text style={styles(colorScheme).versionText}>version {version}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;


const styles = (colorScheme: "light" | "dark") =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme].primaryBackgroundColor,
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 150,
      justifyContent: 'space-between',
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    welcomeTitle: {
      fontSize: 24,
      fontWeight: '400',
      color: Colors[colorScheme].secondaryTextColor,
      marginBottom: 8,
      textAlign: 'center',
    },
    appTitle: {
      fontSize: 36,
      fontWeight: '700',
      color: Colors[colorScheme].primaryTextColor,
      marginBottom: 12,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: Colors[colorScheme].secondaryTextColor,
      textAlign: 'center',
      lineHeight: 24,
    },
    signInCard: {
      backgroundColor: Colors[colorScheme].primaryBackgroundColor,
      borderRadius: 20,
      padding: 32,
      marginHorizontal: 4,
    },
    versionContainer: {
      alignItems: 'center',
      paddingBottom: 40,
    },
    versionText: {
      fontSize: 14,
      color: Colors[colorScheme].secondaryTextColor,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors[colorScheme].primaryBackgroundColor,
    },
    loadingText: {
      color: Colors[colorScheme].primaryTextColor,
      marginTop: 16,
      fontSize: 16,
      fontWeight: '500',
    },
  });