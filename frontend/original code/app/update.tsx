import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useSelector } from "react-redux";
import { RootState } from "@/context/store";

const UpdateScreen = () => {
  const colorScheme = useColorScheme();
  const { versions } = useSelector((state: RootState) => state.version);

  const handleUpdatePress = () => {
    // Open Play Store or App Store link
    Linking.openURL(versions[0].downloadUrl);
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: Colors[colorScheme ?? "light"].primaryBackgroundColor,
      }}
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          marginHorizontal: 40,
        }}
      >
        {/* Update Icon */}
        <Ionicons
          style={{ margin: 20 }}
          name="rocket-sharp"
          size={70}
          color={Colors.companyOrange}
        />

        {/* Title */}
        <Text
          style={{
            fontSize: 24,
            lineHeight: 32,
            fontWeight: 700,
            textAlign: "center",
            color: colorScheme == "dark" ? "#e5e7eb" : "#1f2937",
          }}
          allowFontScaling={false}
        >
          Update Required
        </Text>

        {/* Description */}
        <Text
          style={{
            textAlign: "center",
            color: colorScheme == "dark" ? "#9ca3af" : "#4b5563",
            marginTop: 16,
          }}
          allowFontScaling={false}
        >
          A new version of the app is available. Please update to continue using
          all features.
        </Text>

        {/* Update Button */}
        <TouchableOpacity
          style={{
            backgroundColor: "#2564eb",
            width: "100%",
            paddingVertical: 13,
            paddingHorizontal: 20,
            borderRadius: 16,
            marginTop: 30,
          }}
          onPress={handleUpdatePress}
        >
          <Text
            style={{
              color: colorScheme == "dark" ? "#d1d5db" : "#f9fafb",
              textAlign: "center",
              fontWeight: 600,
              fontSize: 15,
            }}
            allowFontScaling={false}
          >
            Update Now
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default UpdateScreen;
