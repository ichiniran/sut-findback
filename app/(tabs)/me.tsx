import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

export default function MeScreen() {
  const router = useRouter();
  const menuItems = ['จัดการบัญชี', 'รายการที่บันทึกไว้', 'โพสต์ของฉัน', 'การตั้งค่า'];

  const handleMenuPress = (item: string) => {
    if (item === 'จัดการบัญชี') {
      router.push('/account-settings');
    } else if (item === 'การตั้งค่า') {
      router.push('/settings');
    } else if (item === 'โพสต์ของฉัน') {
      router.push('/my-posts');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <View style={styles.avatarWrap}>
            <Image source={require('../../assets/images/icon.png')} style={styles.avatar} />
          </View>

          <View>
            <Text style={styles.userId}>B6703776</Text>
            <Pressable style={styles.editRow}>
              <Text style={styles.editText}>แก้ไขโปรไฟล์</Text>
              <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <Pressable
              key={item}
              onPress={() => handleMenuPress(item)}
              style={[styles.menuItem, index !== menuItems.length - 1 ? styles.menuDivider : undefined]}>
              <Text style={styles.menuText}>{item}</Text>
              <Ionicons name="chevron-forward" size={18} color="#6B4D34" />
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.logoutButton} onPress={() => router.replace('/login')}>
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    body:{
         fontFamily: 'NotoSansThai_400Regular'
    },
    container: {
    flex: 1,
    backgroundColor: '#FFFAF3',
    
  },
  header: {
    backgroundColor: '#fccf87',
    height: 170,
    paddingHorizontal: 26,
    justifyContent: 'flex-end',
    paddingBottom: 18,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  userId: {
    fontFamily: 'NotoSansThai_400Regular',
    fontSize: 16,
    lineHeight: 20,
    color: '#6B3D14',
  },
  editRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editText: {
    fontFamily: 'NotoSansThai_400Regular',
    color: '#FFFFFF',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  menuCard: { 
    backgroundColor: '#ffffff',
    fontFamily: 'NotoSansThai_400Regular'
  },
  menuItem: {
    height: 68,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#B49B83',
  },
  menuText: {
    fontFamily: 'NotoSansThai_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: '#6B4D34',
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 16,
    marginHorizontal: 18,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontFamily: 'NotoSansThai_600SemiBold',
    fontSize: 14,
    lineHeight: 26,
    fontWeight: '600',
    color: '#6B4D34',
  },
});

