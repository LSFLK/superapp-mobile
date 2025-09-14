import { SafeAreaView, View, Text, StyleSheet, useColorScheme, ActivityIndicator } from "react-native";
import React, { useEffect } from "react";
import Constants from "expo-constants";
import { Colors } from "@/constants/Colors";
import SignInMessage from "@/components/SignInMessage";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/context/store";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { DecodedAccessToken } from "@/types/decodeAccessToken.types";
import { getUserInfo, setUserInfo } from "@/context/slices/userInfoSlice";
import { logout } from "@/services/authService";


const LoginScreen = () => {
  const colorScheme = useColorScheme() ?? "light";
  const version = Constants.expoConfig?.version;
  const { accessToken } = useSelector((state: RootState) => state.auth);
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
          const decoded = jwtDecode<DecodedAccessToken>(accessToken);
          const userInfoData = {
            firstName: decoded.given_name || "",
            lastName: decoded.family_name || "",
            workEmail: decoded.email || "",
            employeeThumbnail: null, // Add required field
          };
          
          // Dispatch to Redux store instead of local state
          dispatch(setUserInfo(userInfoData));
          
          console.log("Decoded token:", decoded);
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
      <View style={styles(colorScheme).overlay}>
        <View style={styles(colorScheme).modal}>
          <SignInMessage />
          {/* log response from asgardio and saved tokens */}
          {/* <Text>{JSON.stringify(userInfo, null, 2)}</Text> */}

        </View>
      </View>
      <View style={styles(colorScheme).bottomContainer}>
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
    bottomContainer: {
      marginBottom: 80,
    },
    versionContainer: {
      alignItems: "center",
    },
    versionText: {
      color: Colors[colorScheme].text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      color: Colors[colorScheme].text,
      marginTop: 16,
      fontSize: 16,
    },
  });
