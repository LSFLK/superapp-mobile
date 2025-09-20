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

  // Handle navigation when user is authenticated
  useEffect(() => {
    if (accessToken) {
      // Use setTimeout to ensure navigation happens after component mount
      const timer = setTimeout(() => {
        router.replace("/(tabs)");
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [accessToken , dispatch]);

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

  // Log when userInfo from Redux actually updates
  useEffect(() => {
    if (userInfo) {
      console.log("User info updated in Redux:", userInfo);
    }
  }, [userInfo]);

  // Show loading state if user is authenticated but navigation hasn't happened yet
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
      // shadowColor: Colors[colorScheme].secondaryTextColor,
      // shadowOpacity: 0,
      // elevation: 20,
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