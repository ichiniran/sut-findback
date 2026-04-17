import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PostScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

      
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo_sutfindback.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

     
      <View style={styles.centerContent}>

        <View style={styles.row}>

          {/* FOUND */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => router.push('/post-form?type=found' as any)}
          >
            <LinearGradient
              colors={['#ffffff', '#ffffff']}
              style={styles.cardInner}
            >
              <View style={styles.iconBox}>
                <Ionicons name="search" size={28} color="#F97316" />
              </View>
              <Text style={styles.title}>แจ้งพบของ</Text>
              <Text style={styles.desc}>ช่วยตามหาเจ้าของ</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* LOST */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => router.push('/post-form?type=lost' as any)}
          >
            <LinearGradient
              colors={['#ffffff', '#ffffff']}
              style={styles.cardInner}
            >
              <View style={styles.iconBox}>
                <Ionicons name="alert-circle" size={28} color="#F97316" />
              </View>
              <Text style={styles.title}>แจ้งของหาย</Text>
              <Text style={styles.desc}>ตามหาของที่หาย</Text>
            </LinearGradient>
          </TouchableOpacity>

        </View>

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFAF5',
  },

  header: {
    alignItems: 'center',
    paddingTop: 50,  
  },

  logo: {
    width: 200,
    height: 80,
  },

  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -40,
  },

  row: {
    flexDirection: 'row',
    gap: 14,
  },

  card: {
    flex: 1,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },

  cardInner: {
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },

  iconBox: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 6,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },

  desc: {
    fontSize: 12,
    color: '#888',
  },
});