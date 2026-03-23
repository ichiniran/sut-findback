import { router } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

export default function Splash() {

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View entering={ZoomIn.duration(800).springify().damping(30)}>
        <Image
          source={require("../assets/images/openaapp logo.png")}
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
    backgroundColor: "#FBAA58",
    justifyContent: "center",
    alignItems: "center"
  },

  logo: {
    width: 260,
    height: 120
  }
});
