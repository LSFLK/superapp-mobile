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
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useRestoreLastTab } from "@/hooks/useRestoreLastTab";

type TabType = {
  name: string;
  options: {
    headerShown: boolean;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconFocused: keyof typeof Ionicons.glyphMap;
  };
};

const tabs: TabType[] = [
  {
    name: "index",
    options: {
      headerShown: true,
      title: "Feed",
      icon: "layers-outline",
      iconFocused: "layers-sharp",
    },
  },
  {
    name: "library",
    options: {
      headerShown: true,
      title: "Library",
      icon: "book-outline",
      iconFocused: "book",
    },
  },
  {
    name: "apps",
    options: {
      headerShown: false,
      title: "My Apps",
      icon: "apps-outline",
      iconFocused: "apps",
    },
  },
  {
    name: "profile",
    options: {
      headerShown: true,
      title: "Profile",
      icon: "person-circle-outline",
      iconFocused: "person-circle",
    },
  },
];

export default function TabLayout() {
  // Load last active tab and navigate to it
  useRestoreLastTab();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.companyOrange,
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            paddingTop: 5,
          },
          android: {
            height: 70,
            paddingTop: 5,
            paddingBottom: 5,
          },
        }),
      }}
    >
      {tabs.map((tab, index) => (
        <Tabs.Screen
          key={`tab-${index}`}
          name={tab.name}
          options={{
            headerShown: tab.options.headerShown,
            title: tab.options.title,
            headerTitleAllowFontScaling: false,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? tab.options.iconFocused : tab.options.icon}
                size={28}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
