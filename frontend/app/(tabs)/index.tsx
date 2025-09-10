/**
 * Government SuperApp - Minimal Home Screen
 * 
 * Simple home screen with essential government services
 */

import React from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Government services data
const MICRO_APPS = [
  {
    id: "payslip-viewer",
    name: "Payslip Viewer",
    description: "View your monthly payslips",
    icon: "document-text-outline",
    color: "#2563EB",
    working: true,
  },
  {
    id: "leave-management", 
    name: "Leave Management",
    description: "Apply for leave",
    icon: "calendar-outline",
    color: "#059669",
    working: false,
  },
  {
    id: "directory",
    name: "Employee Directory", 
    description: "Find contacts",
    icon: "people-outline",
    color: "#7c3aed",
    working: false,
  },
];

/**
 * Service card component
 */
function ServiceCard({ app }: { app: typeof MICRO_APPS[0] }) {
  const handlePress = () => {
    if (app.working) {
      // Navigate to any micro-app using local assets
      router.push({
        pathname: "/micro-app",
        params: {
          appId: app.id,
          appName: app.name,
          webViewUri: "local",
          clientId: app.id,
          exchangedToken: "demo_token_123"
        },
      });
    } else {
      Alert.alert(
        "Coming Soon",
        `${app.name} will be available in the next update.`,
        [{ text: "OK" }]
      );
    }
  };

  return (
    <TouchableOpacity style={styles.serviceCard} onPress={handlePress}>
      <View style={styles.iconContainer}>
        <Ionicons name={app.icon as any} size={28} color="#2563EB" />
      </View>
      
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{app.name}</Text>
        <Text style={styles.serviceDescription}>{app.description}</Text>
        {app.working && (
          <View style={styles.workingBadge}>
            <Text style={styles.workingText}>Available</Text>
          </View>
        )}
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );
}

/**
 * Main home screen
 */
export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appTitle}>Government Services</Text>
          <Text style={styles.subtitle}>Ministry of Technology</Text>
        </View>
        
        <TouchableOpacity style={styles.notificationIcon}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Quick Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Ionicons name="apps-outline" size={20} color="#2563EB" />
          <Text style={styles.infoText}>1 Services Available</Text>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="calendar-outline" size={20} color="#2563EB" />
          <Text style={styles.infoText}>January 2025</Text>
        </View>
      </View>

      {/* Services Section */}
      <View style={styles.servicesSection}>
        <Text style={styles.sectionTitle}>Available Services</Text>
        <Text style={styles.sectionSubtitle}>
          Access your government applications and services
        </Text>
        
        {/* Services List */}
        {MICRO_APPS.map((app) => (
          <ServiceCard key={app.id} app={app} />
        ))}
      </View>

      {/* Demo Notice */}
      <View style={styles.demoNotice}>
        <Ionicons name="information-circle" size={20} color="#2563EB" />
        <Text style={styles.demoText}>
          This is a demo SuperApp. Tap "Payslip Viewer" to see the working micro-app.
        </Text>
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E293B",
  },
  servicesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 4,
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
