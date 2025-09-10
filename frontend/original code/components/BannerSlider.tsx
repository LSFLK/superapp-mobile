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
import { Animated, Image, StyleSheet, View, Dimensions } from "react-native";

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

  useEffect(() => {
    const intervalId = setInterval(() => {
      const nextIndex = currentIndex + 1;

      Animated.timing(slideAnim, {
        toValue: -adjustedWidth * nextIndex,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        if (nextIndex === imageList.length - 1) {
          // Jump back to first image instantly
          slideAnim.setValue(0);
          setCurrentIndex(0);
        } else {
          setCurrentIndex(nextIndex);
        }
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [currentIndex, slideAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
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
    gap: 10,
  },
  image: {
    width: "100%",
    height: (screenWidth - 32) * (22 / 35),
    borderRadius: 12,
  },
});
