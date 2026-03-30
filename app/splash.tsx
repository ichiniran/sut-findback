import { router } from "expo-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { app } from "../constants/firebase";

export default function Splash() {

 useEffect(() => {
  const auth = getAuth(app);

  const unsubscribe = onAuthStateChanged(auth, (user) => {
    // เมื่อ firebase เช็คสถานะเสร็จแล้ว
    setTimeout(() => {
      if (user) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    }, 1500); // delay แค่ animation ก็พอ
  });

  return unsubscribe;
}, []);
    
  return (
    <View style={styles.container}>

      {/* รูปฟุ้ง */}
      <Image
        source={require("../assets/images/Ellipse 21.png")} // ใส่ path รูป
        style={styles.bg}
        resizeMode="cover"
      />

      {/* โลโก้ */}
      <Animated.View entering={ZoomIn.duration(800).springify().damping(30)}>
        <Image
          source={require("../assets/images/openlogo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFAF5", 
    justifyContent: "center",
    alignItems: "center"
  },

  bg: {
    position: "absolute",
    width: 500,
    height: 500,
    
  },

  logo: {
    width: 260,
    height: 120
  }
});