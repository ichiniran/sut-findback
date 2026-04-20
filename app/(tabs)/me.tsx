import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../components/UserContext';
import { app } from '../../constants/firebase';

export default function MeScreen() {
  const router = useRouter();
  const menuItems = ['จัดการบัญชี', 'รายการที่บันทึกไว้', 'โพสต์ของฉัน', 'การตั้งค่า'];
  const { user, loading } = useUser();
  console.log('user photoURL:', user?.photoURL);
  const [postCount, setPostCount] = useState<number | null>(null); // ✅ null = ยังไม่โหลด
  const [savedCount, setSavedCount] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) return;

      let ignore = false;

      const fetchCounts = async () => {
        try {
          const db = getFirestore(app);

          //  นับโพสต์จาก flat collection
          const postsSnap = await getDocs(
            query(
              collection(db, 'posts'),
              where('userId', '==', user.uid)
            )
          );

          // ดึง saved (ยังอยู่ใน users เหมือนเดิม)
          const savedFoundCol = collection(db, 'users', user.uid, 'saved_found');
          const savedLostCol = collection(db, 'users', user.uid, 'saved_lost');

          const [savedFoundSnap, savedLostSnap] = await Promise.all([
            getDocs(savedFoundCol),
            getDocs(savedLostCol),
          ]);

          // เช็คว่าโพสต์ที่ bookmark ยังมีอยู่ไหม (เช็คใน posts)
          const checkFound = await Promise.all(
            savedFoundSnap.docs.map(async d => {
              const data = d.data();
              try {
                const snap = await getDoc(doc(db, 'posts', data.postId));
                return snap.exists();
              } catch {
                return false;
              }
            })
          );

          const checkLost = await Promise.all(
            savedLostSnap.docs.map(async d => {
              const data = d.data();
              try {
                const snap = await getDoc(doc(db, 'posts', data.postId));
                return snap.exists();
              } catch {
                return false;
              }
            })
          );

          const validSaved =
            checkFound.filter(Boolean).length +
            checkLost.filter(Boolean).length;

          if (!ignore) {
            setPostCount(postsSnap.size);
            setSavedCount(validSaved);
          } 

        } catch (e) {
          console.log('ERROR fetchCounts:', e);
          /*if (!ignore) {
            setPostCount(0);
            setSavedCount(0);
          }*/
        }
      };

      fetchCounts();

      return () => { ignore = true; };

    }, [user?.uid])
  );

  const handleMenuPress = (item: string) => {
    if (item === 'จัดการบัญชี') router.push('/account-settings');
    else if (item === 'การตั้งค่า') router.push('/settings');
    else if (item === 'โพสต์ของฉัน') router.push('/my-posts-screen');
    else if (item === 'รายการที่บันทึกไว้') router.push('/saved');
  };

  // ฟังก์ชัน logout
  const handleLogout = async () => {
    try {
      const auth = getAuth(app);
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
  };

  return (
    
    <LinearGradient
      colors={['#FFFAF5', '#FFFAF5']}
      //colors={['#ffe4be', '#ffffff']}
      style={styles.container}
    >
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.profileRow}>
          
          {/* profilepic ตัวอักษร */}
          <View style={styles.profileRow}>
            <View style={styles.profilecontain}>
              {loading ? (
                <View style={styles.profilepicBox}>
                  <ActivityIndicator size="small" color="#f8e8dc" />
                </View>
              ) : user?.photoURL ? (
                <Image 
                  source={{ uri: user.photoURL }} 
                  style={styles.profilepic}
                  onError={(e) => console.log('Image error:', e.nativeEvent.error)} 
                />
              ) : (
                <View style={styles.profilepicBox}>
                  <Text style={styles.profilepicText}>
                    {user?.username && user.username !== '-' ? user.username[0].toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Info */}
          <View>
            <Text style={styles.userId}>{user?.username ? user.username : "-"}</Text>
            <Pressable style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
              <Text style={styles.editText}>แก้ไขโปรไฟล์</Text>
              <Ionicons name="pencil-outline" size={14} color="#6E4D31" />
            </Pressable>
          </View>
        </View>

        {/* STAT CARDS */}
        <View style={styles.statsRow}>
        <Pressable style={styles.statCard} onPress={() => router.push('/my-posts-screen')}>
          {postCount === null ? (
            <View style={styles.skelNumber} /> // ✅ skeleton แทนเลข
          ) : (
            <Text style={styles.statNumber}>{postCount}</Text>
          )}
          <Text style={styles.statLabel}>โพสต์ของฉัน</Text>
        </Pressable>
        <Pressable style={styles.statCard} onPress={() => router.push('/saved')}>
          {savedCount === null ? (
            <View style={styles.skelNumber} />
          ) : (
            <Text style={styles.statNumber}>{savedCount}</Text>
          )}
          <Text style={styles.statLabel}>รายการที่บันทึก</Text>
        </Pressable>
      </View>
      </View>

      {/* MENU */}
      <View style={styles.content}>
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <Pressable
              key={item}
              onPress={() => handleMenuPress(item)}
              style={[
                styles.menuItem,
                index !== menuItems.length - 1 && styles.menuDivider,
              ]}
            >
              <Text style={styles.menuText}>{item}</Text>
              <Ionicons name="chevron-forward" size={18} color="#6B4D34" />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </Pressable>
      </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    padding: 20,
  },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profilecontain: { 
    width: 72, 
    height: 72, 
    borderRadius: 36, 
    backgroundColor: '#FFFFFF', 
    alignItems: 'center', 
    justifyContent: 'center', 
  }, 
  profilepic: { 
    width: 70, 
    height: 70, 
    borderRadius: 40, 
  },
  profilepicBox: {
    width: 70,
    height: 70,
    borderRadius: 40,
    backgroundColor: '#f8e8dc',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profilepicText: {
    fontSize: 28,
    color: '#6E4D31',
    fontWeight: '700',
  },

  editIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#F4A261',
    borderRadius: 10,
    padding: 4,
  },

  userId: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d1b10',
  },

  role: {
    fontSize: 13,
    color: '#7a5c3a',
    marginTop: 2,
  },

  editBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },

  editText: {
    fontSize: 14,
    color: '#6E4D31',
    fontWeight: '600',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },

  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d1b10',
  },

  statLabel: {
    fontSize: 13,
    color: '#7a5c3a',
    marginTop: 4,
  },

  content: {
    flex: 1,
    paddingTop: 10,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
  },

  menuCard: {
    backgroundColor: '#fff',
    paddingVertical: 5,
    borderRadius: 10,
    marginHorizontal: 10,
    
  },

  menuItem: {
    height: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  
  },

  menuDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  menuText: {
    fontSize: 14,
    color: '#6B4D34',
    fontWeight: '500',
  },

  logoutButton: {
    marginTop: 16,
    marginHorizontal: 18,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f33939',
  },
  skelNumber: {
  width: 32,
  height: 24,
  borderRadius: 6,
  backgroundColor: '#ffffff',
  marginBottom: 4,
},
});