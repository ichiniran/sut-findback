import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>

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

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    justifyContent:"center",
    padding:20,
    backgroundColor:"#F4E6D4"
  },
  title:{
    fontSize:24,
    textAlign:"center",
    marginBottom:20
  },
  input:{
    backgroundColor:"#eee",
    padding:15,
    borderRadius:20,
    marginBottom:15
  },
  button:{
    backgroundColor:"#F29D4B",
    padding:15,
    borderRadius:25,
    alignItems:"center"
  },
  buttonText:{
    color:"#fff",
    fontSize:16
  }
});