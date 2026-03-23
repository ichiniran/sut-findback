import { router } from "expo-router";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Regis() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../assets/images/logo_sutfindback.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput placeholder="Full Name" style={styles.input} />
        <TextInput placeholder="Email" style={styles.input} autoCapitalize="none" />
        <TextInput placeholder="Username" style={styles.input} autoCapitalize="none" />
        <TextInput placeholder="Password" secureTextEntry style={styles.input} />
        <TextInput placeholder="Confirm Password" secureTextEntry style={styles.input} />

        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Register</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text style={styles.footerLink} onPress={() => router.replace("/login")}>
            Login
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBAA58",
  },
  header: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 50,
  },
  logo: {
    width: 200,
    height: 80,
  },
  card: {
    flex: 1,
    backgroundColor: "#FFF4E6",
    borderTopRightRadius: 80,
    padding: 30,
  },
  title: {
    fontFamily: "NotoSansThai_400Regular",
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 30,
    marginTop: 20,
    color: "#5A4633",
  },
  input: {
    fontFamily: "NotoSansThai_400Regular",
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    padding: 15,
    marginBottom: 18,
  },
  primaryButton: {
    backgroundColor: "#FBAA58",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 30,
  },
  primaryButtonText: {
    fontFamily: "NotoSansThai_400Regular",
    fontSize: 16,
  },
  footerText: {
    fontFamily: "NotoSansThai_400Regular",
    textAlign: "center",
    fontSize: 13,
    color: "#5A4633",
  },
  footerLink: {
    fontFamily: "NotoSansThai_400Regular",
    textDecorationLine: "underline",
  },
});
