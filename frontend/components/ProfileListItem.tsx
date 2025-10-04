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
import { View, Text, useColorScheme, StyleSheet } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { Skeleton } from "./Skeleton";

/**
 * Props for ProfileListItem component.
 */
type ProfileListItemProps = {
  icon: string;
  title: string;
  /**
   * Value can be string, number or null/undefined. Numbers (e.g. employee IDs) will be stringified.
   */
  value?: string | number | null | undefined;
  /** If explicitly loading, always show skeleton */
  loading?: boolean;
};

const ProfileListItem = React.memo(
  ({ icon, title, value, loading }: ProfileListItemProps) => {
    const colorScheme = useColorScheme();
    const styles = createStyles(colorScheme ?? "light");

    // Normalize value safely. We purposely keep numeric 0 ("0") as a valid display value.
    const normalized = (value === null || value === undefined)
      ? ""
      : (typeof value === "string" ? value : String(value)).trim();

    const showSkeleton = loading || !normalized;

    return (
      <View style={{ paddingVertical: 8 }}>
        <View style={styles.row}>
          <Ionicons
            name={icon as keyof typeof Ionicons.glyphMap}
            size={24}
            style={styles.iconText}
          />
          <View style={{ flexDirection: "column", gap: 3 }}>
            <Text style={styles.titleText}>{title}</Text>
            {showSkeleton ? (
              <Skeleton width={220} height={10} style={{ marginTop: 4 }} />
            ) : (
              <Text style={styles.valueText}>{normalized}</Text>
            )}
          </View>
        </View>
      </View>
    );
  }
);

export default ProfileListItem;

const createStyles = (colorScheme: "light" | "dark") =>
  StyleSheet.create({
    row: {
      marginHorizontal: 10,
      flexDirection: "row",
      padding: 10,
      alignItems: "center",
      gap: 15,
    },
    iconText: {
      color: Colors[colorScheme].primaryTextColor,
    },
    titleText: {
      color: Colors[colorScheme].ternaryTextColor,
      fontSize: 16,
      fontWeight: "500",
    },
    valueText: {
      color: Colors[colorScheme].primaryTextColor,
      fontSize: 14,
    },
  });
