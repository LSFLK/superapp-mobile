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
import {
  StyleSheet,
  useColorScheme,
  View,
  ScrollView,
  Text,
  Dimensions,
  useWindowDimensions
} from "react-native";
import React, { useEffect, useState } from "react";
import FeedSkeleton from "@/components/FeedSkeleton";
import { Colors } from "@/constants/Colors";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ScreenPaths } from "@/constants/ScreenPaths";
import { useTrackActiveScreen } from "@/hooks/useTrackActiveScreen";
import useNewsFeed from "@/hooks/useNewsFeed";
import News from "@/components/News";
import useEventsFeed from "@/hooks/useEventsFeed";
import Event from "@/components/Event";
import BannerSlider from "@/components/BannerSlider";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

const bannerImages = [
  require("../../assets/images/banner1.png"),
  require("../../assets/images/banner2.png"),
  require("../../assets/images/banner3.png"),
];

const Discovery = () => {
  const tabBarHeight: number = useBottomTabBarHeight();
  const colorScheme = useColorScheme();
  const styles = createStyles(colorScheme ?? "light", tabBarHeight);
  const [isMinTimeElapsed, setIsMinTimeElapsed] = useState(false);

  useTrackActiveScreen(ScreenPaths.FEED);
  const { newsItems, loading } = useNewsFeed();
  const { eventItems } = useEventsFeed();

  useEffect(() => {
    /**
     * Delays rendering of the main content for a minimum of 1 second to ensure that
     * the skeleton UI is displayed briefly. This helps prevent the issue where the
     * index page content flashes too quickly and causes a poor visual experience
     * (especially when the app initially loads on the default screen).
     */
    const timer = setTimeout(() => {
      setIsMinTimeElapsed(true);
    }, 1000); // 1 second

    return () => clearTimeout(timer);
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
    }, 10000); // 10 seconds

    return () => clearInterval(intervalId); // Clean up on unmount
  }, []);

  return (
    <View style={styles.background}>
      {!isMinTimeElapsed || loading ? (
        <FeedSkeleton />
      ) : (
        <ScrollView style={{ padding: 16, marginTop: 5 }}>
          {/* Banner image slider */}
          <BannerSlider />

          {/* Events section */}
          {eventItems && eventItems.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.header}>Events</Text>

              <ScrollView horizontal={true}>
                {eventItems.map((item, index) => (
                  <Event key={index} item={item} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* News section */}
          {newsItems && newsItems.length > 0 && (
            <View style={{ paddingBottom: tabBarHeight }}>
              <Text style={styles.header}>News</Text>

              {newsItems.map((news, index) => (
                <News
                  item={news}
                  key={`${news.guid?.["#text"] || news.link}-${index}`}
                />
              ))}
            </View>
          )}

          {/* if no events or news items are available  visit my app tab for microapps*/}
          {(!eventItems || eventItems.length === 0) && (!newsItems || newsItems.length === 0) && (
            // should be in center of screen with disabled text color 
                <View style={styles.emptyNewsEventsContainer}>
                  <Ionicons 
                    name="albums-outline" 
                    size={80} 
                    color={Colors[colorScheme ?? "light"].secondaryTextColor}
                    style={{ opacity: 0.5, marginBottom: 20 }}
                  />
                  
                  <Text style={styles.emptyText}>
                    No News or Events Available{"\n"}Visit the{" "}
                    <Text
                      onPress={() => router.push(ScreenPaths.MY_APPS)}
                      style={{ color: Colors.companyOrange }}
                    >
                      My Apps
                    </Text>{" "}
                    to access and download apps
                  </Text>
                </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default Discovery;

const createStyles = (colorScheme: "light" | "dark", tabBarHeight: number) =>
  StyleSheet.create({
    background: {
      backgroundColor: Colors[colorScheme].primaryBackgroundColor,
    },
    image: {
      width: "100%",
      height: (screenWidth - 32) * (22 / 35),
      borderRadius: 12,
    },
    header: {
      color: Colors[colorScheme ?? "light"].ternaryTextColor,
      fontSize: 24,
      fontWeight: "700",
      marginVertical: 10,
    },
    emptyNewsEventsContainer: {
      flex: 1, 
      alignItems: "center", 
      paddingHorizontal: 40,
      paddingTop: 48,
      minHeight: windowHeight / 2 + tabBarHeight,

    },   
    emptyText: {
      color: Colors[colorScheme].secondaryTextColor,
      fontSize: 12,
      textAlign: "center",
    }, 
  });
