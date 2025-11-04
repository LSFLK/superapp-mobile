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
const BANNER_HORIZONTAL_PADDING = 22; // Horizontal padding for the banner slider
const adjustedWidth = screenWidth - BANNER_HORIZONTAL_PADDING;

const bannerImages = [
  require("../assets/images/banner1.png"),
  require("../assets/images/banner2.png"),
  require("../assets/images/banner3.png"),
];

// Duplicate first image at end for smooth transition
const imageList = [...bannerImages, bannerImages[0]];

export default function BannerSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const baseOffset = useRef(10); // current translateX base (negative)
  const isInteracting = useRef(false);

  const clearAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current as any);
      autoPlayRef.current = null;
    }
  };

  const startAutoPlay = () => {
    clearAutoPlay();
    autoPlayRef.current = setInterval(() => {
      goToNext();
    }, 5000);
  };

  useEffect(() => {
    // start autoplay on mount
    startAutoPlay();
    return () => clearAutoPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // whenever currentIndex changes, update baseOffset so pan calculations stay consistent
    baseOffset.current = -adjustedWidth * currentIndex;
    slideAnim.setValue(baseOffset.current);
    // restart autoplay timer when slide completes and not interacting
    if (!isInteracting.current) {
      startAutoPlay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const goToIndex = (index: number) => {
    Animated.timing(slideAnim, {
      toValue: -adjustedWidth * index,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (index === imageList.length - 1) {
        // Jump back to first image instantly
        slideAnim.setValue(0);
        setCurrentIndex(0);
      } else if (index <= 0) {
        setCurrentIndex(0);
      } else {
        setCurrentIndex(index);
      }
    });
  };

  const goToNext = () => {
    const nextIndex = currentIndex + 1;
    // animate to next
    Animated.timing(slideAnim, {
      toValue: -adjustedWidth * nextIndex,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      if (nextIndex === imageList.length - 1) {
        slideAnim.setValue(0);
        setCurrentIndex(0);
      } else {
        setCurrentIndex(nextIndex);
      }
    });
  };

  // Pan responder for manual dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        isInteracting.current = true;
        clearAutoPlay();
      },
      onPanResponderMove: (_, gestureState) => {
        // follow finger
        const value = baseOffset.current + gestureState.dx;
        slideAnim.setValue(value);
      },
      onPanResponderRelease: (_, gestureState) => {
        const dx = gestureState.dx;
        const threshold = adjustedWidth * 0.2; // 20% swipe to change

        let targetIndex = currentIndex;
        if (dx < -threshold) {
          targetIndex = currentIndex + 1;
        } else if (dx > threshold) {
          targetIndex = Math.max(0, currentIndex - 1);
        }

        // snap to target
        isInteracting.current = false;
        goToIndex(targetIndex);
        // resume autoplay after short delay so the animation finishes
        setTimeout(() => {
          if (!isInteracting.current) startAutoPlay();
        }, 600);
      },
      onPanResponderTerminate: () => {
        // treat as release
        isInteracting.current = false;
        goToIndex(currentIndex);
        setTimeout(() => {
          if (!isInteracting.current) startAutoPlay();
        }, 600);
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
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {imageList.map((image, index) => (
          <Image
            key={index}
            source={image}
            style={styles.image}
            resizeMode="cover"
          />
        ))}
      </Animated.View>
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
    gap:10,
  },
  image: {
    width: "100%",
    height: (screenWidth - 32) * (22 / 35),
    borderRadius: 12,
  },
});
