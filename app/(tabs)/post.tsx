import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PostScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoBlock}>
          <Image
            source={require("../../assets/images/openlogo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Buttons */}
        <View style={styles.btnGroup}>
          {/* พบของ — solid orange */}
          <TouchableOpacity
            style={styles.btnOutline}
            activeOpacity={0.85}
            onPress={() => router.push("/post-form?type=found" as any)}
          >
            <View style={styles.iconWrapOrange}>
              <Ionicons name="map-outline" size={20} color="#F97316" />
            </View>
            <View style={styles.btnText}>
              <Text style={styles.btnTitleDark}>พบของ</Text>
              <Text style={styles.btnSubOrange}>แจ้งว่าพบของผู้อื่น</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#FBAA58" />
          </TouchableOpacity>

          {/* ของหาย — outlined */}
          <TouchableOpacity
            style={styles.btnOutline}
            activeOpacity={0.85}
            onPress={() => router.push("/post-form?type=lost" as any)}
          >
            <View style={styles.iconWrapOrange}>
              <Ionicons name="search-outline" size={20} color="#F97316" />
            </View>
            <View style={styles.btnText}>
              <Text style={styles.btnTitleDark}>ของหาย</Text>
              <Text style={styles.btnSubOrange}>แจ้งว่าของตัวเองหาย</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#FBAA58" />
          </TouchableOpacity>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#FBAA58"
            />
            <Text style={styles.infoText}>
              กรุณาให้ข้อมูลที่ถูกต้องและครบถ้วน
              เพื่อช่วยให้การตามหาของรวดเร็วขึ้น
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFAF5" },
  inner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  logoBlock: {
    gap: 4,
    marginBottom: 30,
    marginTop: -200,
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
    shadowColor: "#ffbd8e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  logoSub: { fontSize: 12, color: "#FBAA58" },

  illustBox: { marginBottom: 32 },

  question: { fontSize: 13, color: "#9A8070", marginBottom: 28 },

  btnGroup: { width: "100%", gap: 14 },

  btnSolid: {
    backgroundColor: "#F97316",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  btnOutline: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#F0E6DA",
  },

  iconWrapWhite: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapOrange: {
    width: 40,
    height: 40,
    backgroundColor: "#FFF0E0",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  btnText: { flex: 1 },
  btnTitleWhite: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  btnSubWhite: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
  btnTitleDark: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5A4633",
    marginBottom: 2,
  },
  btnSubOrange: { fontSize: 13, color: "#FBAA58" },
  infoBanner: {
    marginTop: 16,
    backgroundColor: "#fff3e687",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    borderColor: "#FBAA58",
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#FBAA58",
    lineHeight: 18,
  },
});
