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
import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  useColorScheme,
  Dimensions,
  ScrollView,
} from "react-native";
import { Skeleton } from "./Skeleton";
import { Colors } from "@/constants/Colors";

const screenWidth = Dimensions.get("window").width;

const FeedSkeleton = () => {
  const skeletonData: number[] = [1, 2, 3];
  const colorScheme = useColorScheme() ?? "light";
  const styles = useMemo(() => createStyles(colorScheme), [colorScheme]);

  return (
    <View style={{ padding: 16, marginTop: 5 }}>
      {/* Banner image */}
      <Skeleton
        style={{ width: "100%" }}
        borderRadius={12}
        height={(screenWidth - 32) * (22 / 35)}
      />

      {/* Events section */}
      <View style={{ marginTop: 20 }}>
        <Skeleton width={100} height={30} />
        <ScrollView
          style={{ marginTop: 10 }}
          horizontal={true}
          scrollEnabled={false}
        >
          {skeletonData.map((index) => (
            <View style={styles.card} key={index}>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Skeleton width={20} height={20} /> {/* Skeleton for icon */}
                  <Skeleton width={80} height={12} style={{ marginLeft: 4 }} />
                  {/* Skeleton for type */}
                </View>
                <Skeleton width={60} height={12} /> {/* Skeleton for date */}
              </View>

              {/* Featured Image */}
              <Skeleton
                style={{ width: "100%" }}
                height={180}
                borderRadius={12}
              />

              {/* Title */}
              <Skeleton
                height={18}
                style={{ width: "100%", marginBottom: 18, marginTop: 10 }}
              />

              {/* Description */}
              <View style={styles.descriptionContainer}>
                <Skeleton width={250} height={10} style={{ marginTop: 4 }} />
                <Skeleton width={250} height={10} style={{ marginTop: 1 }} />
                <Skeleton width={150} height={10} style={{ marginTop: 1 }} />
              </View>

              {/* More info button */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 4,
                  alignItems: "center",
                  justifyContent: "flex-end",
                  marginTop: 4,
                }}
              >
                <Skeleton width={80} height={12} />
                {/* Skeleton for icon */}
                <Skeleton width={15} height={15} />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* News section */}
      <View style={{ marginTop: 20 }}>
        <Skeleton width={100} height={30} />

        {skeletonData.map((index) => (
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Skeleton width={20} height={20} /> {/* Skeleton for icon */}
                <Skeleton width={80} height={12} style={{ marginLeft: 4 }} />
                {/* Skeleton for type */}
              </View>
              <Skeleton width={60} height={12} /> {/* Skeleton for date */}
            </View>

            {/* Title */}
            <Skeleton
              height={18}
              style={{ width: "100%", marginBottom: 6, marginTop: 10 }}
            />
            <Skeleton
              height={18}
              style={{ width: "60%", marginBottom: 18, marginTop: 1 }}
            />

            {/* Description */}
            <View style={styles.descriptionContainer}>
              <Skeleton width={320} height={10} style={{ marginTop: 4 }} />
              <Skeleton width={320} height={10} />
              <Skeleton width={150} height={10} />
            </View>

            {/* More info button */}
            <View
              style={{
                flexDirection: "row",
                gap: 4,
                alignItems: "center",
                justifyContent: "flex-end",
                marginTop: 4,
              }}
            >
              <Skeleton width={80} height={12} />
              {/* Skeleton for icon */}
              <Skeleton width={15} height={15} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default FeedSkeleton;

const createStyles = (colorScheme: "light" | "dark") =>
  StyleSheet.create({
    card: {
      backgroundColor: Colors[colorScheme].libraryCardBackgroundColor,
      borderRadius: 14,
      padding: 16,
      marginTop: 10,
      marginInlineEnd: 10,
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
    descriptionContainer: {
      flexDirection: "column",
      gap: 10,
      marginBottom: 10,
      maxWidth: 275,
    },
  });
