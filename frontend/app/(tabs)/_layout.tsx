/**
 * Government SuperApp - Simple Tab Layout
 * 
 * Only essential tabs: Home and Profile
 * Clean, minimal navigation
 */

import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563EB", // Government blue
        headerShown: false, // Hide headers for cleaner look
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            paddingTop: 5,
          },
          android: {
            height: 60,
            paddingTop: 5,
            paddingBottom: 5,
          },
        }),
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      
      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
