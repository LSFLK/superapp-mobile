/**
 * Government SuperApp - Home Screen
 * 
 * Shows downloaded microapps and allows launching them
 */

import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SUPERAPP_BASE_URL, DOWNLOADED } from "@/constants/Constants";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/context/store";
import { ScreenPaths } from "@/constants/ScreenPaths";
import { MicroApp } from "@/context/slices/appSlice";
import { loadMicroAppDetails } from "@/services/appStoreService";

function MicroAppCard({ app, user }: { app: MicroApp; user: { empID: string } | null }) {
  const { accessToken } = useSelector((state: RootState) => state.auth);

  const handlePress = async () => {
    if (app.status === DOWNLOADED && app.webViewUri) {
      router.push({
        pathname: "/micro-app",
        params: {
          appId: app.appId,
          appName: app.name,
          webViewUri: app.webViewUri,
          clientId: app.clientId || "default-client-id",
          exchangedToken: accessToken || "",
          empID: user?.empID || "",
        },
      });
    } else {
      Alert.alert("App not available", "This app needs to be downloaded first. Go to the Store tab to install it.", [
        { text: "OK" },
      ]);
    }
  };

  const getIconName = (appId: string) => {
    switch (appId) {
      case "payslip-viewer":
        return "document-text-outline";
      case "leave-management":
        return "calendar-outline";
      case "tax-filing":
        return "cash-outline";
      default:
        return "apps-outline";
    }
  };

  return (
    <TouchableOpacity style={styles.serviceCardBox} onPress={handlePress}>
      <View style={[
        styles.iconBox, 
        app.status !== DOWNLOADED && styles.iconBoxDisabled,
        styles.cardShadow
      ]}>
        <Ionicons 
          name={getIconName(app.appId) as any} 
          size={32} 
          color={app.status === DOWNLOADED ? "#2563EB" : "#9CA3AF"} 
        />
      </View>
      <Text style={[styles.serviceNameBox, app.status !== DOWNLOADED && styles.serviceNameDisabled]}>
        {app.name}
      </Text>
      {app.status === DOWNLOADED && (
        <View style={styles.downloadedBadge}>
          <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
          <Text style={styles.downloadedText}>Ready</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function Index() {
  const dispatch = useDispatch<AppDispatch>();
  const [user, setUser] = useState<{ name: string; department: string; empID: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const { userInfo } = useSelector((state: RootState) => state.userInfo);
  const { apps } = useSelector((state: RootState) => state.apps);

  // Get time-based greeting
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  };

  // Mock logout function
  const logout = async () => {
    console.log("Logout called");
  };

  const fetchUser = async () => {
    try {
      const res = await fetch(`${SUPERAPP_BASE_URL}/user-info?email=${userInfo?.workEmail}`);
      if (res.ok) {
        const data = await res.json();
        setUser({ name: data.firstName, department: data.department, empID: data.employeeID });
      }
    } catch (err) {
      console.error("Failed to fetch user info", err);
      // Set default user if fetch fails
      setUser({ name: "Demo User", department: "Government Ministry", empID: "EMP001" });
    } finally {
      setLoading(false);
    }
  };

  const loadApps = async () => {
    try {
      await loadMicroAppDetails(dispatch, logout);
    } catch (error) {
      console.error("Failed to load microapps:", error);
    }
  };

  useEffect(() => {
    fetchUser();
    loadApps();
  }, []);

  useEffect(() => {
    if (!accessToken) {
      const timer = setTimeout(() => {
        router.replace(ScreenPaths.LOGIN);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [accessToken]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUser(), loadApps()]);
    setRefreshing(false);
  };

  const availableApps = apps.length > 0 ? apps : [];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>
                {user ? user.name.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greeting}>Good {getTimeOfDay()}</Text>
              <Text style={styles.appTitle}>{user ? user.name : "Loading..."}</Text>
              <Text style={styles.subtitle}>{user ? user.department : ""}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.notificationIcon}>
            <Ionicons name="notifications-outline" size={24} color="#1E293B" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {availableApps.length > 0 ? (
          <View style={styles.servicesSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Your Services</Text>
                <Text style={styles.sectionSubtitle}>
                  {availableApps.filter(app => app.status === DOWNLOADED).length} of {availableApps.length} apps ready
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.storeButton}
                onPress={() => router.push('/(tabs)/store')}
              >
                <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
                <Text style={styles.storeButtonText}>Store</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.servicesGrid}>
              {availableApps.map((app) => (
                <MicroAppCard key={app.appId} app={app} user={user} />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="apps-outline" size={64} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No Services Available</Text>
            <Text style={styles.emptyDescription}>
              Connect to the internet and pull down to refresh, or check the Store tab to browse available services
            </Text>
            <TouchableOpacity 
              style={styles.emptyActionButton}
              onPress={() => router.push('/(tabs)/store')}
            >
              <Text style={styles.emptyActionText}>Browse Store</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.demoNotice}>
        <Ionicons name="information-circle" size={20} color="#2563EB" />
        <Text style={styles.demoText}>
          This is a demo SuperApp. Download apps from the Store tab to see them here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 2,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "400",
  },
  notificationIcon: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  servicesSection: {
    padding: 24,
    paddingTop: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  storeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  storeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },
  serviceCardBox: {
    alignItems: "center",
    justifyContent: "center",
    width: "33%",
    marginBottom: 24,
    position: "relative",
  },
  iconBox: {
    width: 72,
    height: 72,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#EFF6FF",
  },
  iconBoxDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    opacity: 0.7,
  },
  cardShadow: {
    shadowColor: "#2563EB",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  serviceNameBox: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
    lineHeight: 18,
  },
  serviceNameDisabled: {
    color: "#94A3B8",
    fontWeight: "500",
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  downloadedBadge: {
    position: "absolute",
    top: -8,
    right: 8,
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: "#10B981",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  downloadedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyActionButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyActionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  demoNotice: {
    flexDirection: "row",
    margin: 24,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    shadowColor: "#2563EB",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  demoText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 14,
    color: "#1E293B",
    lineHeight: 20,
    fontWeight: "500",
  },
});



// import React, { useState } from "react";
// import {
//   StyleSheet,
//   View,
//   ScrollView,
//   Text,
//   TouchableOpacity,
//   Alert
// } from "react-native";
// import { router } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useEffect } from "react";


// // Government services data
// const MICRO_APPS = [
//   {
//     id: "payslip-viewer",
//     name: "Payslip Viewer",
//     description: "View your monthly payslips",
//     icon: "document-text-outline",
//     color: "#2563EB",
//     working: true,
//   },
//   {
//     id: "leave-management", 
//     name: "Leave Management",
//     description: "Apply for leave",
//     icon: "calendar-outline",
//     color: "#059669",
//     working: false,
//   },
//   {
//     id: "directory",
//     name: "Employee Directory", 
//     description: "Find contacts",
//     icon: "people-outline",
//     color: "#7c3aed",
//     working: false,
//   },
// ];

// /**
//  * Service card component
//  */
// function ServiceCard({ app }: { app: typeof MICRO_APPS[0] }) {
//   const handlePress = async () => {
//   if (app.working) {
//     const token = await AsyncStorage.getItem("superapp_token");
//     router.push({
//       pathname: "/micro-app",
//       params: {
//         appId: app.id,
//         appName: app.name,
//         webViewUri: "local",
//         clientId: app.id,
//         exchangedToken: token || "",
//       },
//     });
//   } else {
//     Alert.alert("Coming Soon", `${app.name} will be available soon.`, [{ text: "OK" }]);
//   }
// };


//   return (
//     <TouchableOpacity style={styles.serviceCard} onPress={handlePress}>
//       <View style={styles.iconContainer}>
//         <Ionicons name={app.icon as any} size={28} color="#2563EB" />
//       </View>
      
//       <View style={styles.serviceInfo}>
//         <Text style={styles.serviceName}>{app.name}</Text>
//         <Text style={styles.serviceDescription}>{app.description}</Text>
//         {app.working && (
//           <View style={styles.workingBadge}>
//             <Text style={styles.workingText}>Available</Text>
//           </View>
//         )}
//       </View>
      
//       <Ionicons name="chevron-forward" size={20} color="#666" />
//     </TouchableOpacity>
//   );
// }

// /**
//  * Main home screen
//  */
// export default function HomeScreen() {
  
//   const [token, setToken] = useState<string | null>(null);

//   useEffect(() => {
//     const checkLogin = async () => {
//       const token = await AsyncStorage.getItem("superapp_token");

//       if (!token) {
//         // Trigger Asgardeo login here
//         router.push("/login"); 
//       } else {
//         setToken(token);
//       }
//     };

//     checkLogin();
//   }, []);


//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       {/* Header */}
//       <View style={styles.header}>
//         <View>
//           <Text style={styles.welcomeText}>Welcome to</Text>
//           <Text style={styles.appTitle}>Government Services</Text>
//           <Text style={styles.subtitle}>Ministry of Technology</Text>
//         </View>
        
//         <TouchableOpacity style={styles.notificationIcon}>
//           <Ionicons name="notifications-outline" size={24} color="#333" />
//         </TouchableOpacity>
//       </View>

//       {/* Quick Info */}
//       <View style={styles.infoSection}>
//         <View style={styles.infoCard}>
//           <Ionicons name="apps-outline" size={20} color="#2563EB" />
//           <Text style={styles.infoText}>1 Services Available</Text>
//         </View>
//         <View style={styles.infoCard}>
//           <Ionicons name="calendar-outline" size={20} color="#2563EB" />
//           <Text style={styles.infoText}>January 2025</Text>
//         </View>
//       </View>

//       {/* Services Section */}
//       <View style={styles.servicesSection}>
//         <Text style={styles.sectionTitle}>Available Services</Text>
//         <Text style={styles.sectionSubtitle}>
//           Access your government applications and services
//         </Text>
        
//         {/* Services List */}
//         {MICRO_APPS.map((app) => (
//           <ServiceCard key={app.id} app={app} />
//         ))}
//       </View>

//       {/* Demo Notice */}
//       <View style={styles.demoNotice}>
//         <Ionicons name="information-circle" size={20} color="#2563EB" />
//         <Text style={styles.demoText}>
//           This is a demo SuperApp. Tap "Payslip Viewer" to see the working micro-app.
//         </Text>
//       </View>

//       {/* Bottom spacing */}
//       <View style={{ height: 100 }} />
//     </ScrollView>
//   );
// }


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F8FAFC",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "flex-start",
//     padding: 20,
//     paddingTop: 60,
//     backgroundColor: "#FFFFFF",
//   },
//   welcomeText: {
//     fontSize: 16,
//     color: "#64748B",
//     marginBottom: 4,
//   },
//   appTitle: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#1E293B",
//     marginBottom: 4,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: "#64748B",
//   },
//   notificationIcon: {
//     padding: 8,
//   },
//   infoSection: {
//     flexDirection: "row",
//     paddingHorizontal: 20,
//     marginTop: 20,
//     gap: 12,
//   },
//   infoCard: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#FFFFFF",
//     padding: 16,
//     borderRadius: 12,
//     gap: 12,
//   },
//   infoText: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#1E293B",
//   },
//   servicesSection: {
//     padding: 20,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#1E293B",
//     marginBottom: 4,
//   },
//   sectionSubtitle: {
//     fontSize: 14,
//     color: "#64748B",
//     marginBottom: 20,
//   },
//   serviceCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#FFFFFF",
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 12,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   iconContainer: {
//     width: 48,
//     height: 48,
//     backgroundColor: "#EFF6FF",
//     borderRadius: 12,
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 16,
//   },
//   serviceInfo: {
//     flex: 1,
//   },
//   serviceName: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#1E293B",
//     marginBottom: 4,
//   },
//   serviceDescription: {
//     fontSize: 14,
//     color: "#64748B",
//     lineHeight: 20,
//   },
//   workingBadge: {
//     alignSelf: "flex-start",
//     backgroundColor: "#10B981",
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 12,
//     marginTop: 8,
//   },
//   workingText: {
//     fontSize: 12,
//     fontWeight: "500",
//     color: "#FFFFFF",
//   },
//   demoNotice: {
//     flexDirection: "row",
//     margin: 20,
//     padding: 16,
//     backgroundColor: "#EFF6FF",
//     borderRadius: 12,
//     alignItems: "flex-start",
//   },
//   demoText: {
//     flex: 1,
//     marginLeft: 12,
//     fontSize: 14,
//     color: "#1E293B",
//     lineHeight: 20,
//   },
// });
