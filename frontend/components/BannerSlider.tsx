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
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  View,
  Dimensions,
  PanResponder,
} from "react-native";

const screenWidth = Dimensions.get("window").width;
const BANNER_PADDING = 32; // 16px on each side
const BANNER_GAP = 16; // Gap between banners
const BANNER_WIDTH = screenWidth - BANNER_PADDING;
const AUTO_PLAY_INTERVAL = 5000; // 5 seconds

const bannerImages = [
  require("../assets/images/banner1.png"),
  require("../assets/images/banner2.png"),
  require("../assets/images/banner3.png"),
];

export default function BannerSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);
  const startPositionRef = useRef(0);
  const currentIndexRef = useRef(0);

  // Keep ref in sync with state
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Auto-play logic
  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const startAutoPlay = () => {
    stopAutoPlay();
    autoPlayTimer.current = setTimeout(() => {
      goToNext();
    }, AUTO_PLAY_INTERVAL);
  };

  const stopAutoPlay = () => {
    if (autoPlayTimer.current) {
      clearTimeout(autoPlayTimer.current);
      autoPlayTimer.current = null;
    }
  };

  const goToNext = () => {
    const nextIndex = (currentIndexRef.current + 1) % bannerImages.length;
    goToIndex(nextIndex);
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
    const targetPosition = -index * (BANNER_WIDTH + BANNER_GAP);
    startPositionRef.current = targetPosition;
    Animated.spring(scrollX, {
      toValue: targetPosition,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  // Pan responder for manual swiping
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        stopAutoPlay();
        // Store the current scroll position when touch starts
        const index = currentIndexRef.current;
        startPositionRef.current = -index * (BANNER_WIDTH + BANNER_GAP);
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = startPositionRef.current + gestureState.dx;
        scrollX.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const index = currentIndexRef.current;
        const threshold = BANNER_WIDTH * 0.25;
        let targetIndex = index;

        // Simple logic: just check swipe distance
        if (gestureState.dx < -threshold && index < bannerImages.length - 1) {
          // Swiped left enough - go to next
          targetIndex = index + 1;
        } else if (gestureState.dx > threshold && index > 0) {
          // Swiped right enough - go to previous
          targetIndex = index - 1;
        } 
        goToIndex(targetIndex);
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.slider,
          {
            transform: [{ translateX: scrollX }],
          },
        ]}
      >
        {bannerImages.map((image, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image
              source={image}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        ))}
      </Animated.View>

      {/* Dots indicator */}
      <View style={styles.dotsContainer}>
        {bannerImages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
  },
  slider: {
    flexDirection: "row",
    gap: BANNER_GAP,
  },
  imageContainer: {
    width: BANNER_WIDTH,
  },
  image: {
    width: BANNER_WIDTH,
    height: BANNER_WIDTH * (22 / 35),
    borderRadius: 12,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
  },
  activeDot: {
    backgroundColor: "#F97316",
    width: 24,
  },
});
