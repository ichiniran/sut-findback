import { FontAwesome } from '@expo/vector-icons';
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, getFirestore, query, where } from "firebase/firestore";
import { useState } from "react";
import { Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { app } from "../constants/firebase";
export default function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      let email = emailOrUsername;
      // ถ้าไม่ใช่ email ให้ค้นหา email จาก username ใน Firestore
      if (!emailOrUsername.includes("@")) {
        const db = getFirestore(app);
        const q = query(collection(db, "users"), where("username", "==", emailOrUsername));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          email = querySnapshot.docs[0].data().email;
        } else {
          alert("ไม่พบ username นี้");
          return;
        }
      }
      const auth = getAuth(app);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // ล็อกอินสำเร็จ ไปหน้า tabs
      router.replace("/(tabs)");
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  };
  return (
    <LinearGradient
      colors={["#FFFAF5", "#ffe6d0"]}
      style={styles.container}
    >

      {/* Logo */}
      <View style={styles.header}>
        <Image
          source={require("../assets/images/logo_sutfindback.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>


      {/* Content */}
      {Platform.OS === "ios" ? (
        <BlurView intensity={25} tint="light" style={styles.card}>
          {/* ...content... */}
          <Text style={styles.title}>Login</Text>
          <TextInput
            placeholder="Email or Username"
            placeholderTextColor="#777"
            style={styles.input}
            autoCapitalize="none"
            onChangeText={setEmailOrUsername}
            value={emailOrUsername}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#777"
            secureTextEntry
            style={styles.input}
            onChangeText={setPassword}
            value={password}
          />
          <Text style={styles.forgot}>forgot Password?</Text>
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
          >
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
          <View style={styles.dividerContainer}>
            <View style={styles.line}/>
            <Text style={styles.dividerText}>Or Login with</Text>
            <View style={styles.line}/>
          </View>
          <View style={styles.social}>
            {/* Google */}
            <TouchableOpacity style={styles.socialBtn}>
              <Image
                source={require('../assets/images/google.png')} 
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {/* Apple */}
            <TouchableOpacity style={styles.socialBtn}>
              <FontAwesome name="apple" size={24} color="black" />
            </TouchableOpacity>
          </View>
          <Text style={styles.register}>
            Don't have an account?{' '}
            <Text style={styles.create} onPress={() => router.push("/regis")}>
              Create New Account
            </Text>
          </Text>
        </BlurView>
      ) : (
        <View style={[styles.cardand,]}> 
          {/* ...content... */}
          <Text style={styles.title}>Login</Text>
          <TextInput
            placeholder="Email or Username"
            placeholderTextColor="#777"
            style={styles.input}
            autoCapitalize="none"
            onChangeText={setEmailOrUsername}
            value={emailOrUsername}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#777"
            secureTextEntry
            style={styles.input}
            onChangeText={setPassword}
            value={password}
          />
          <Text style={styles.forgot}>forgot Password?</Text>
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
          >
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
          <View style={styles.dividerContainer}>
            <View style={styles.line}/>
            <Text style={styles.dividerText}>Or Login with</Text>
            <View style={styles.line}/>
          </View>
          <View style={styles.social}>
            {/* Google */}
            <TouchableOpacity style={styles.socialBtn}>
              <Image
                source={require('../assets/images/google.png')} 
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {/* Apple */}
            <TouchableOpacity style={styles.socialBtn}>
              <FontAwesome name="apple" size={24} color="black" />
            </TouchableOpacity>
          </View>
          <Text style={styles.register}>
            Don't have an account?{' '}
            <Text style={styles.create} onPress={() => router.push("/regis")}>
              Create New Account
            </Text>
          </Text>
        </View>
      )}

    </LinearGradient>
  );
}
const styles = StyleSheet.create({

  container:{
    flex:1,
    paddingHorizontal:20
  },

   header:{
    height:200,
    justifyContent:"center",
    alignItems:"center",
    marginTop:50
  },

  logo:{
    width:200,
    height:80
  },

  content:{
    flex:1,
    justifyContent:"flex-start"
  },

  title:{
    fontSize:22,
    fontWeight:"600",
    textAlign:"center",
    marginBottom:30,
    color:"#5A4633",
    marginTop:20
  },

  input:{
    backgroundColor:"#ffffff",
    borderRadius:25,
    padding:15,
    marginBottom:20
  },

  forgot:{
    textAlign:"right",
    fontSize:12,
    color:"#5A4633",
    marginBottom:25
  },

  loginButton:{
    backgroundColor:"#FBAA58",
    padding:15,
    borderRadius:25,
    alignItems:"center",
    marginBottom:35
  },

  loginText:{
    fontSize:16,
    color:"#fff"
  },

  dividerContainer:{
    flexDirection:"row",
    alignItems:"center",
    marginBottom:20
  },

  line:{
    flex:1,
    height:1,
    backgroundColor:"#bbb"
  },

  dividerText:{
    marginHorizontal:10,
    fontSize:12,
    color:"#777"
  },

    social: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 5,
  },

  socialBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },

  socialIcon:{
    fontSize:28
  },

  register:{
    marginTop:20,
    textAlign:"center",
    fontSize:13,
    color:"#333"
  },

  create:{
    textDecorationLine:"underline",
    color: "#FBAA58"
  },
  card:{
  height:"65%",
  width:"100%",
  marginTop:10,
  padding:30,
  borderRadius:40,
  backgroundColor:"rgba(255,255,255,0.25)",
  borderWidth:2,
  borderColor:"rgba(255, 255, 255, 0.66)",

  overflow:"hidden",

  // shadow iOS
  shadowColor:"#000",
  shadowOffset:{ width:0, height:10 },
  shadowOpacity:0.1,
  shadowRadius:20,

  // shadow Android
  elevation:10
},
  cardand:{
  height:"65%",
  width:"100%",
  marginTop:10,
  padding:30,
  borderRadius:40,
  backgroundColor:"rgba(255, 255, 255, 0.47)",
  borderWidth:1,
  borderColor:"rgba(145, 145, 145, 0.1)",
  overflow:"hidden",
 
},

});