import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function AccountSettingsScreen() {
  const router = useRouter();

  return (
   <SafeAreaView style={styles.container} edges={['top','bottom']}>
  <View style={styles.header}>
    <Pressable onPress={() => router.back()} style={styles.backButton}>
      <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
    </Pressable>
    <Text style={styles.headerTitle}>จัดการบัญชี</Text>
    <View style={{ width: 24 }} />
  </View>

  <View style={styles.content}>
    <View style={styles.menuCard}>
      
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Email</Text>
        <Text style={styles.fieldValue}>sut1101103@gmail.com</Text>
      </View>

      <Pressable 
        onPress={() => router.push('/change-password')}
        style={[styles.menuItem, styles.menuDivider]}>
        <Text style={styles.menuText}>เปลี่ยนรหัสผ่าน</Text>
        <Ionicons name="chevron-forward" size={18} color="#6B4D34" />
      </Pressable>

    </View>
  </View>

  <View style={{ height: 100, backgroundColor: "#FFFAF3" }} />

</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8C46E',
  },
  header: {
    backgroundColor: '#F8C46E',
    height: 70,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'NotoSansThai_600SemiBold',
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingTop: 8,
    backgroundColor: '#FFFAF3',
  },
  menuCard: {
    backgroundColor: '#ffffff',
    fontFamily: 'NotoSansThai_400Regular',
  },
  menuItem: {
    height: 68,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuDivider: {
    borderTopWidth: 1,
    borderTopColor: '#B49B83',
  },
  fieldRow: {
    height: 68,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: '#B49B83',
  },
  fieldLabel: {
    fontFamily: 'NotoSansThai_400Regular',
    fontSize: 14,
    color: '#6B4D34',
  },
  fieldValue: {
    fontFamily: 'NotoSansThai_400Regular',
    fontSize: 14,
    color: '#6B4D34',
    fontWeight: '500',
  },
  menuText: {
    fontFamily: 'NotoSansThai_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: '#6B4D34',
    fontWeight: '500',
  },
});

