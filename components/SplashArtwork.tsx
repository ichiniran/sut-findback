import { Image, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

export default function SplashArtwork() {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/Ellipse 21.png')} style={styles.bg} resizeMode="cover" />
      <Animated.View entering={ZoomIn.duration(800).springify().damping(30)}>
        <Image source={require('../assets/images/openlogo.png')} style={styles.logo} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFAF5', justifyContent: 'center', alignItems: 'center' },
  bg: { position: 'absolute', width: 500, height: 500 },
  logo: { width: 260, height: 120 },
});
