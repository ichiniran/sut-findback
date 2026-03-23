import { router } from "expo-router";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Login() {
  return (
    <View style={styles.container}>
      
      {/* Orange Header */}
      <View style={styles.header}>
        <Image
          source={require("../assets/images/logo_sutfindback.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Login Card */}
      <View style={styles.card}>

        <Text style={styles.title}>Login</Text>

        <TextInput
          placeholder="Username/Email"
          style={styles.input}
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          style={styles.input}
        />

        <Text style={styles.forgot}>forgot Password?</Text>

        <TouchableOpacity style={styles.loginButton} onPress={() => router.replace("../(tabs)/")}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.line}/>
          <Text style={styles.dividerText}>Or Login with</Text>
          <View style={styles.line}/>
        </View>

        <View style={styles.social}>
          <Text style={styles.socialIcon}>G</Text>
          <Text style={styles.socialIcon}></Text>
        </View>

        <Text style={styles.register}>
          Don't have an account?{' '}
          <Text style={styles.create} onPress={() => router.push("/regis")}>
            Create New Account
          </Text>
        </Text>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:"#FBAA58"
  },

  header:{
    height:200,
    justifyContent:"center",
    alignItems:"center",
    marginBottom:10,
    marginTop:50
  },

  logo:{
    width:200,
    height:80
  },

  card:{
    flex:1,
    backgroundColor:"#FFF4E6",
    borderTopRightRadius:80,
    padding:30
  },

  title:{
    fontFamily:"Inter_400Regular",
    fontSize:22,
    fontWeight:"600",
    textAlign:"center",
    marginBottom:30,
    marginTop:30,
    color:"#5A4633"
  },

  input:{
    fontFamily:"Inter_400Regular",
    backgroundColor:"#ffffff",
    borderRadius:25,
    padding:15,
    marginBottom:20
  },

  forgot:{
    fontFamily:"Inter_400Regular",
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
    fontFamily:"Inter_400Regular",
    fontSize:16
  },

  dividerContainer:{
    flexDirection:"row",
    alignItems:"center",
    marginBottom:20
  },

  line:{
    flex:1,
    height:1,
    backgroundColor:"#999"
  },

  dividerText:{
    fontFamily:"Inter_400Regular",
    marginHorizontal:10,
    fontSize:12
  },

  social:{
    flexDirection:"row",
    justifyContent:"center",
    gap:30,
    marginBottom:25
  },

  socialIcon:{
    fontFamily:"Inter_400Regular",
    fontSize:28
  },

  register:{
    fontFamily:"Inter_400Regular",
    textAlign:"center",
    fontSize:13
  },

  create:{
    fontFamily:"Inter_400Regular",
    textDecorationLine:"underline"
  }

});