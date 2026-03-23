import { StyleSheet, Text, View } from 'react-native';

export default function NotifyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notify</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4E6',
  },
  title: {
    fontFamily: 'NotoSansThai_400Regular',
    fontSize: 24,
    fontWeight: '600',
    color: '#5A4633',
  },
});

