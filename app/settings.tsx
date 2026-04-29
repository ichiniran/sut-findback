import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const router = useRouter();
  const [notification, setNotification] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("notificationEnabled").then((val) => {
      if (val !== null) setNotification(val === "true");
    });
  }, []);

  const handleToggle = async (value: boolean) => {
    setNotification(value);
    await AsyncStorage.setItem("notificationEnabled", String(value));
  };
  return (
    <LinearGradient colors={["#FFFAF5", "#FFFAF5"]} style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* 🔥 GLASS HEADER */}
        <BlurView intensity={60} tint="light" style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#6B4D34" />
          </Pressable>

          <Text style={styles.headerTitle}>การตั้งค่า</Text>

          <View style={{ width: 40 }} />
        </BlurView>

        {/* CONTENT */}
        <View style={styles.content}>
          <View style={styles.menuCard}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>การแจ้งเตือน</Text>
              <Switch
                style={{ marginTop: 15 }}
                value={notification}
                onValueChange={handleToggle}
                trackColor={{ false: "#E0D5C6", true: "#81C784" }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  header: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 60,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    // backgroundColor: 'rgba(255,255,255,0.4)',
    overflow: "hidden",
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d1b10",
  },

  content: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 16,
  },

  menuCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.6)",
  },

  settingRow: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  settingLabel: {
    fontSize: 14,
    color: "#6B4D34",
    fontWeight: "600",
  },
});
