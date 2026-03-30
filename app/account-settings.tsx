import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user && user.email) setEmail(user.email);
  }, []);

  return (
    <LinearGradient
      colors={['#FFFAF5', '#FFFAF5']}
      style={{ flex: 1 }}
    >
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>

        {/* 🔥 GLASS HEADER */}
        <BlurView intensity={60} tint="light" style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#6B4D34" />
          </Pressable>

          <Text style={styles.headerTitle}>จัดการบัญชี</Text>

          <View style={{ width: 40 }} />
        </BlurView>

        {/* CONTENT */}
        <View style={styles.content}>
          <View style={styles.menuCard}>

            {/* EMAIL */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>
                {email ? email : "-"}
              </Text>
            </View>

            {/* CHANGE PASSWORD */}
            <Pressable
              onPress={() => router.push('/change-password')}
              style={styles.menuItem}
            >
              <Text style={styles.menuText}>เปลี่ยนรหัสผ่าน</Text>
              <Ionicons name="chevron-forward" size={18} color="#6B4D34" />
            </Pressable>

          </View>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  header: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 60,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d1b10',
  },

  content: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 16,
  },

  menuCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgb(255, 255, 255)',
  },

  fieldRow: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    borderBottomWidth: 0.5,
    borderBottomColor: '#e5d3bd',
  },

  fieldLabel: {
    fontSize: 14,
    color: '#6B4D34',
    fontWeight: '600',
  },

  fieldValue: {
    fontSize: 14,
    color: '#2d1b10',
    fontWeight: '500',
  },

  menuItem: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  menuText: {
    fontSize: 14,
    color: '#6B4D34',
    fontWeight: '500',
  },
});