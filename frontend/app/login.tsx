import { SafeAreaView, View, Text, StyleSheet, useColorScheme } from "react-native";
import Constants from "expo-constants";
import { Colors } from "@/constants/Colors";
import SignInMessage from "@/components/SignInMessage";

const LoginScreen = () => {
  const colorScheme = useColorScheme() ?? "light";
  const version = Constants.expoConfig?.version;

  return (
    <SafeAreaView style={styles(colorScheme).container}>
      <View style={styles(colorScheme).overlay}>
        <View style={styles(colorScheme).modal}>
          <SignInMessage />
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
  });
