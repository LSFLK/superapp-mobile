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
import { StyleSheet, useColorScheme, View } from "react-native";
import { Colors } from "@/constants/Colors";
import React from "react";
import { Skeleton } from "./Skeleton";

const LibrarySkelton = () => {
  const skeletonData = [1, 2];
  const colorScheme = useColorScheme();
  const styles = createStyles(colorScheme ?? "light");

  return skeletonData.map((_, index) => (
    <View key={`skelton-${index}`} style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Skeleton width={20} height={20} /> {/* Skeleton for icon */}
          <Skeleton width={80} height={12} style={{ marginLeft: 4 }} />
          {/* Skeleton for type */}
        </View>
        <Skeleton width={60} height={12} /> {/* Skeleton for date */}
      </View>

      {/* Featured Image */}
      <Skeleton style={{ width: "100%" }} height={180} borderRadius={12} />

      {/* Title */}
      <Skeleton
        height={18}
        style={{ width: "100%", marginBottom: 18, marginTop: 10 }}
      />

      {/* Author */}
      <View style={styles.authorContainer}>
        <Skeleton width={40} height={40} circle />
        {/* Skeleton for author image */}
        <View style={styles.authorTextContainer}>
          {/* Skeleton for author name */}
          <Skeleton width={120} height={12} />
          {/* Skeleton for designation */}
          <Skeleton width={150} height={10} style={{ marginTop: 4 }} />
        </View>
      </View>

      {/* Tags */}
      <View style={styles.tagContainer}>
        <Skeleton
          width={60}
          height={25}
          borderRadius={999}
          style={{ marginRight: 2 }}
        />
        <Skeleton width={60} height={25} borderRadius={999} />
      </View>
    </View>
  ));
};

export default LibrarySkelton;

const createStyles = (colorScheme: "light" | "dark") =>
  StyleSheet.create({
    card: {
      backgroundColor: Colors[colorScheme].libraryCardBackgroundColor,
      borderRadius: 14,
      padding: 16,
      marginTop: 15,
      marginHorizontal: 10,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    authorContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 18,
    },
    authorTextContainer: {
      width: "80%",
    },
    tagContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      borderTopColor: Colors[colorScheme].primaryTextColor,
      borderTopWidth: 0.25,
      paddingTop: 12,
    },
  });
