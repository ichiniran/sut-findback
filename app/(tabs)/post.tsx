import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PostScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFAF5', '#FFFAF5']}
        style={styles.header}
      >
        <Image
                  source={require('../../assets/images/logo_sutfindback.png')}
                  style={{ width: 200, height: 80 , marginTop: 20}}
                  resizeMode="contain"
                />
        
      </LinearGradient>

      <View style={styles.cards}>
        <TouchableOpacity
          style={styles.cardShadow}
          onPress={() => router.push('/(tabs)/post-found' as any)}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#FFBB6B', '#F97316']} style={styles.card}>
            <Ionicons name="search" size={44} color="#fff" />
            <Text style={styles.cardTitle}>แจ้งพบของ</Text>
            <Text style={styles.cardDesc}>พบของที่ไม่ใช่ของตัวเอง{'\n'}ต้องการแจ้งให้เจ้าของทราบ</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cardShadow}
          onPress={() => router.push('/(tabs)/post-lost' as any)}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#FFD9B8', '#FFAA60']} style={styles.card}>
            <Ionicons name="alert-circle-outline" size={44} color="#fff" />
            <Text style={styles.cardTitle}>แจ้งของหาย</Text>
            <Text style={styles.cardDesc}>ทำของหายและต้องการ{'\n'}ความช่วยเหลือในการค้นหา</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFAF5' },
  header: {
    paddingTop: 80,
    paddingBottom: 30,
    alignItems: 'center',
  },
  title: { fontSize: 26, fontWeight: '700', color: '#5A4633' },
  sub: { fontSize: 14, color: '#999', marginTop: 6 },
  cards: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  cardShadow: {
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  card: { borderRadius: 20, padding: 28, alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  cardDesc: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 20 },
});