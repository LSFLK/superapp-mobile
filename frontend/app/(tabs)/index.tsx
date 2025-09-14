/**
 * Government SuperApp - Minimal Home Screen
 * 
 * Simple home screen with essential government services
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SUPERAPP_BASE_URL, EMP_ID } from "@/constants/Constants";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/context/store";
import { ScreenPaths } from "@/constants/ScreenPaths";


const MICRO_APPS = [
  {
    id: "payslip-viewer",
    name: "Payslip",
    description: "View your monthly payslips",
    icon: "document-text-outline",
    color: "#2563EB",
    working: true,
  },
  {
    id: "leave-management",
    name: "Leave",
    description: "Apply for leave",
    icon: "calendar-outline",
    color: "#059669",
    working: false,
  },
  {
    id: "Tax Filing",
    name: "Tax",
    description: "Find contacts",
    icon: "cash-outline",
    color: "#7c3aed",
    working: false,
  },
];

function ServiceCard({ app }: { app: typeof MICRO_APPS[0] }) {
  const handlePress = async () => {
    if (app.working) {
      const token = await AsyncStorage.getItem("superapp_token");
      router.push({
        pathname: "/micro-app",
        params: {
          appId: app.id,
          appName: app.name,
          webViewUri: "local",
          clientId: app.id,
          exchangedToken: token || "",
        },
      });
    } else {
      Alert.alert("Coming Soon", `${app.name} will be available soon.`, [
        { text: "OK" },
      ]);
    }
  };

  return (
    <TouchableOpacity style={styles.serviceCardBox} onPress={handlePress}>
      <View style={styles.iconBox}>
        <Ionicons name={app.icon as any} size={32} color="#2563EB" />
      </View>
      <Text style={styles.serviceNameBox}>{app.name}</Text>
    </TouchableOpacity>
  );

}

export default function Index() {
  const [user, setUser] = useState<{ name: string; department: string } | null>(null);
    const { accessToken } = useSelector((state: RootState) => state.auth);
      const { userInfo } = useSelector((state: RootState) => state.userInfo);
    

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${SUPERAPP_BASE_URL}/users/mock/${EMP_ID}`);
        console.log(res);
        if (res.ok) {
          const data = await res.json();
          setUser({ name: data.name, department: data.department });
        }
      } catch (err) {
        console.error("Failed to fetch user info", err);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!accessToken) {
      // Use setTimeout to ensure navigation happens after component mount
      const timer = setTimeout(() => {
        router.replace(ScreenPaths.LOGIN);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [accessToken]);


  return (
    <View style={styles.container}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>{user ? user.name : "Loading..."}</Text>
            <Text style={styles.subtitle}>{user ? user.department : ""}</Text>
          </View>

          <TouchableOpacity style={styles.notificationIcon}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Available Services</Text>

          <View style={styles.servicesGrid}>
            {MICRO_APPS.map((app) => (
              <ServiceCard key={app.id} app={app} />
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      <View style={styles.demoNotice}>
        <Ionicons name="information-circle" size={20} color="#2563EB" />
        <Text style={styles.demoText}>
          This is a demo SuperApp. Tap "Payslip Viewer" to see the working
          micro-app.
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#FFFFFF",
  },
  welcomeText: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 4,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  notificationIcon: {
    padding: 8,
  },
  infoSection: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  infoCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    //backgroundColor: "#FFFFFF",
    paddingBottom: 20,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E293B",
  },
  servicesSection: {
    paddingTop: 50,
    padding: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 30,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 20,
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  serviceCardBox: {
    alignItems: "center",
    justifyContent: "center",
    width: "33%",
    marginBottom: 16,
  },
  iconBox: {
    width: 64,
    height: 64,
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  serviceNameBox: {
    fontSize: 14,
    fontWeight: "400",
    color: "#233552ff",
    textAlign: "center",
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
  workingBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 8,
  },
  workingText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  demoNotice: {
    flexDirection: "row",
    margin: 20,
    padding: 16,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    alignItems: "flex-start",
  },
  demoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: "#1E293B",
    lineHeight: 20,
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
