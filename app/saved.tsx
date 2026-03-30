import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PostCard from '../components/PostCard';
import { app } from '../constants/firebase';
//import FoundScreen from './found';
//import LostScreen from './lost';

export default function SavedScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'found' | 'lost'>('found');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
  useCallback(() => {
    const fetchSavedPosts = async () => {
      setLoading(true);
      try {
        const auth = getAuth(app);
        const user = auth.currentUser;
        if (!user) { setPosts([]); setLoading(false); return; }

        const db = getFirestore(app);
        const saveType = activeTab === 'found' ? 'saved_found' : 'saved_lost';
        const colRef = collection(db, 'users', user.uid, saveType);
        const snap = await getDocs(colRef);

        // ✅ ดึง status ล่าสุดจากโพสต์จริง
        const postCollection = activeTab === 'found' ? 'found_posts' : 'lost_posts';
        const data = await Promise.all(snap.docs.map(async docSnap => {
        const saved = docSnap.data();
        try {
          const { getDoc, doc } = await import('firebase/firestore');
          const postRef = doc(db, 'users', saved.userId, postCollection, saved.postId);
          const postSnap = await getDoc(postRef);
          if (postSnap.exists()) {
            return { ...saved, currentStatus: postSnap.data().status || 'waiting' };
          } else {
            return null; // ✅ โพสต์ถูกลบแล้ว
          }
        } catch {}
        return saved;
      }));

      // ✅ กรองโพสต์ที่ถูกลบออก
      const filtered = data.filter(item => item !== null);
      setPosts(filtered);
      } catch (e) {
        setPosts([]);
      }
      setLoading(false);
    };
    fetchSavedPosts();
  }, [activeTab])
);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>

      {/* HEADER */}
      <LinearGradient colors={['#ffffff', '#ffffff']} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#333" />
        </Pressable>

        <Text style={styles.headerTitle}>รายการที่บันทึก</Text>

        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* TAB */}
      <View style={styles.tabBar}>
        <Pressable style={styles.tabItem} onPress={() => setActiveTab('found')}>
          <Text style={[styles.tabLabel, activeTab === 'found' && styles.tabLabelActive]}>
            พบของ
          </Text>
          {activeTab === 'found' && <View style={styles.tabIndicator} />}
        </Pressable>

        <Pressable style={styles.tabItem} onPress={() => setActiveTab('lost')}>
          <Text style={[styles.tabLabel, activeTab === 'lost' && styles.tabLabelActive]}>
            ของหาย
          </Text>
          {activeTab === 'lost' && <View style={styles.tabIndicator} />}
        </Pressable>
      </View>

      {/* CONTENT */}
      <View style={{ flex: 1, padding: 10 }}>
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 30 }}>กำลังโหลด...</Text>
        ) : posts.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 30 }}>ไม่มีรายการบันทึก</Text>
        ) : (
          <FlatList
            data={posts}
            numColumns={2}
            keyExtractor={(item, idx) => item.postId || String(idx)}
            contentContainerStyle={{ paddingBottom: 20 }}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            renderItem={({ item }) => {
              // DEBUG LOG
              console.log('[SavedScreen] post.type:', item.type, 'activeTab:', activeTab, 'postId:', item.postId);
              // แก้ไข images เป็น array จริง ๆ
              let imagesArr = item.images;
              if (typeof imagesArr === 'string') {
                try {
                  imagesArr = JSON.parse(imagesArr);
                } catch {
                  imagesArr = imagesArr ? [imagesArr] : [];
                }
              }
              return (
                <PostCard
                  key={item.postId}
                  {...item}
                  images={imagesArr}
                  image={{ uri: imagesArr && imagesArr.length > 0 ? imagesArr[0] : (item.imageUri || '') }}
                  userId={item.userId || item.postOwnerUid}
                />
              );
            }}
          />
        )}
      </View>

    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  header: {
    height: 60,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },

  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },

  tabLabelActive: {
    color: '#F97316',
  },

  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '50%',
    backgroundColor: '#F97316',
    borderRadius: 2,
  },
});