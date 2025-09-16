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
import { Colors } from "@/constants/Colors";
import { useSignInWithAsgardeo } from "@/hooks/useSignInWithAsgardeo";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

/**
 * SignInMessage is a presentational component displayed inside the sign-in modal.
 * It shows a sign-in icon, informative text, and a button to trigger the sign-in flow using Asgardeo.
 *
 * If the sign-in request is not ready, a loading spinner is shown instead of the button text.
 */
const SignInMessage = React.memo(
  ({
    message = "Please sign in to continue using the app",
  }: {
    message?: string;
  }) => {
    const colorScheme = useColorScheme();
    const styles = createStyles(colorScheme ?? "light");
    const [isLoading, setIsLoading] = useState(false);

    const performSignIn = useSignInWithAsgardeo();

    const handleSignInPress = async () => {
      setIsLoading(true);
      try {
        await performSignIn();
      } catch (error) {
        console.error("Sign-in process failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <>
        {/* Sign-in icon */}
        <Ionicons
          name="log-in-outline"
          size={40}
          color={Colors.companyOrange}
          style={styles.icon}
        />

        {/* Title */}
        <Text style={styles.title}>Sign in Required</Text>

        {/* Description */}
        <Text style={styles.message}>{message}</Text>

        {/* Sign-in button or loading indicator */}
        <TouchableOpacity
          disabled={isLoading}
          style={styles.button}
          onPress={handleSignInPress}
          activeOpacity={0.5}
        >
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={Colors[colorScheme ?? "light"].primaryBackgroundColor}
            />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </>
    );
  }
);

export default SignInMessage;

/**
 * Generates themed styles based on the current color scheme.
 *
 * @param {("light" | "dark")} colorScheme - The current theme mode.
 * @returns {object} A StyleSheet object containing the component's styles.
 */
const createStyles = (colorScheme: "light" | "dark") =>
  StyleSheet.create({
    icon: {
      marginBottom: 8,
<<<<<<< HEAD
=======
      paddingLeft:3
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: Colors[colorScheme].text,
<<<<<<< HEAD
      marginBottom: 10,
=======
      marginBottom: 30,
      paddingLeft:8
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
    },
    message: {
      fontSize: 16,
      textAlign: "center",
<<<<<<< HEAD
      marginBottom: 30,
=======
      marginBottom: 15,
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
      color: Colors[colorScheme].primaryTextColor,
    },
    button: {
      backgroundColor: Colors.companyOrange,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      paddingVertical: 12,
<<<<<<< HEAD
      width: "80%",
=======
      width: "100%",
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
      marginBottom: 10,
    },
    buttonText: {
      fontSize: 16,
      lineHeight: 20,
      color: Colors[colorScheme].primaryBackgroundColor,
      fontWeight: "600",
    },
  });
