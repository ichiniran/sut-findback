import { FontAwesome } from '@expo/vector-icons';
import * as Google from "expo-auth-session/providers/google";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { collection, doc, getDocs, getFirestore, query, setDoc, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { app } from "../constants/firebase";
WebBrowser.maybeCompleteAuthSession();

export default function Regis() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

  const [request, response, promptAsync] = Google.useAuthRequest({
  clientId: "116975610523-frhl9qbispig2bb92rh6ea8ecu164gfo.apps.googleusercontent.com",
});

useEffect(() => {
  if (response?.type === "success") {
    const { id_token } = response.params;
    const credential = GoogleAuthProvider.credential(id_token);

    const auth = getAuth(app);

    signInWithCredential(auth, credential).then((userCredential) => {
      
      const user = userCredential.user;

      const db = getFirestore(app);

      // save ลง Firestore ด้วย
      setDoc(doc(db, "users", user.uid), {
        username: user.displayName || "Google User",
        email: user.email,
        createdAt: new Date(),
        photoURL: [], // เพิ่มฟิลด์ photoURL เป็น array ว่าง
      });

      router.replace("/(tabs)");
    });
  }
}, [response]);
const handleRegister = async () => {
  if (password !== confirmPassword) {
    alert("Password ไม่ตรงกัน");
    return;
  }

  try {
    const auth = getAuth(app);
    const db = getFirestore(app);

    // 🔥 เช็ค username ซ้ำก่อน
    const q = query(
      collection(db, "users"),
      where("username", "==", username)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      alert("username นี้ถูกใช้แล้ว");
      return;
    }

    // ✅ ถ้าไม่ซ้ำ → สมัคร
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      username,
      email,
      createdAt: new Date(),
      images: [],
    });

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
        <Text style={styles.title}>Sign up</Text>

        <TextInput placeholder="Username" placeholderTextColor="#777" style={styles.input} autoCapitalize="none"  onChangeText={setUsername}/>
        <TextInput placeholder="Email" placeholderTextColor="#777" style={styles.input} autoCapitalize="none" onChangeText={setEmail} />
        <TextInput placeholder="Password" placeholderTextColor="#777" secureTextEntry style={styles.input} onChangeText={setPassword} />
        <TextInput placeholder="Confirm Password" placeholderTextColor="#777" secureTextEntry style={styles.input} onChangeText={setConfirmPassword} />

        <TouchableOpacity style={styles.loginButton} onPress={handleRegister}>
          <Text style={styles.loginText}>Register</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.line}/>
          <Text style={styles.dividerText}>Or Sign up with</Text>
          <View style={styles.line}/>
        </View>

        <View style={styles.social}>
               
               {/* Google */}
               <TouchableOpacity style={styles.socialBtn} onPress={() => promptAsync()}>
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
          Already have an account?{' '}
          <Text style={styles.create} onPress={() => router.replace("/login")}> 
            Login
          </Text>
        </Text>
       </BlurView >
       ) : (
        <View style={styles.cardand}>
        <Text style={styles.title}>Sign up</Text>

        <TextInput placeholder="Username" placeholderTextColor="#777" style={styles.input} autoCapitalize="none"  onChangeText={setUsername}/>
        <TextInput placeholder="Email" placeholderTextColor="#777" style={styles.input} autoCapitalize="none" onChangeText={setEmail} />
        <TextInput placeholder="Password" placeholderTextColor="#777" secureTextEntry style={styles.input} onChangeText={setPassword} />
        <TextInput placeholder="Confirm Password" placeholderTextColor="#777" secureTextEntry style={styles.input} onChangeText={setConfirmPassword} />

        <TouchableOpacity style={styles.loginButton} onPress={handleRegister}>
          <Text style={styles.loginText}>Register</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.line}/>
          <Text style={styles.dividerText}>Or Sign up with</Text>
          <View style={styles.line}/>
        </View>

        <View style={styles.social}>
               
               {/* Google */}
               <TouchableOpacity style={styles.socialBtn} onPress={() => promptAsync()}>
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
          Already have an account?{' '}
          <Text style={styles.create} onPress={() => router.replace("/login")}> 
            Login
          </Text>
        </Text>
       </View >
       )}
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
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
    color:"#5A4633"
  },

  input:{
    backgroundColor:"#ffffff",
    borderRadius:25,
    padding:15,
    marginBottom:20,
    
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

  register: {
    marginTop: 20,
    marginBottom: 20,
    textAlign: "center",
    fontSize: 13,
    color: "#5A4633",
  },

  create:{
    textDecorationLine:"underline",
    color: "#FBAA58"
  },
  card:{
 height: "70%",
  width:"100%",
 // marginTop: -40, 
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
  height:"70%",
  width:"100%",
  marginTop:0,
  padding:30,
  borderRadius:40,
  backgroundColor:"rgba(255, 255, 255, 0.47)",
  borderWidth:1,
  borderColor:"rgba(145, 145, 145, 0.1)",
  overflow:"hidden",
 
},

});
