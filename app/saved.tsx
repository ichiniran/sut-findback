import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, getFirestore, orderBy, query } from 'firebase/firestore';
import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PostCard from '../components/PostCard';
import { app } from '../constants/firebase';

export default function SavedScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'found' | 'lost'>('found');
  const [foundPosts, setFoundPosts] = useState<any[]>([]);
  const [lostPosts, setLostPosts] = useState<any[]>([]);
  const [loadingFound, setLoadingFound] = useState(false);
  const [loadingLost, setLoadingLost] = useState(false);
  const fetchedRef = useRef<{ found: boolean; lost: boolean }>({ found: false, lost: false });

  const fetchPosts = useCallback(async (type: 'found' | 'lost') => {
    const setLoading = type === 'found' ? setLoadingFound : setLoadingLost;
    const setPosts = type === 'found' ? setFoundPosts : setLostPosts;

    // ถ้าโหลดแล้ว ไม่ต้องโหลดซ้ำ
    if (fetchedRef.current[type]) return;

    setLoading(true);
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user) { setPosts([]); setLoading(false); return; }

      const db = getFirestore(app);
      const saveType = type === 'found' ? 'saved_found' : 'saved_lost';
      const colRef = collection(db, 'users', user.uid, saveType);
      const snap = await getDocs(query(colRef, orderBy('savedAt', 'desc')));

      const data = await Promise.all(
        snap.docs.map(async docSnap => {
          const saved = docSnap.data();
          try {
            const postSnap = await getDoc(doc(db, 'posts', saved.postId));
            if (postSnap.exists()) {
              return { ...saved, currentStatus: postSnap.data().status || 'waiting' };
            }
            return null;
          } catch {
            return saved;
          }
        })
      );

      setPosts(data.filter(item => item !== null));
      fetchedRef.current[type] = true; // mark ว่าโหลดแล้ว
    } catch {
      setPosts([]);
    }
    setLoading(false);
  }, []);

  // เมื่อกลับมาที่หน้านี้ ให้ reset cache แล้วโหลดใหม่
  useFocusEffect(
    useCallback(() => {
      fetchedRef.current = { found: false, lost: false };
      fetchPosts('found');
      fetchPosts('lost');
    }, [fetchPosts])
  );

  const posts = activeTab === 'found' ? foundPosts : lostPosts;
  const loading = activeTab === 'found' ? loadingFound : loadingLost;

  const renderContent = () => {
    if (loading) {
      return <Text style={styles.emptyText}>กำลังโหลด...</Text>;
    }
    if (posts.length === 0) {
      return <Text style={styles.emptyText}>ไม่มีรายการบันทึก</Text>;
    }
    return (
      <FlatList
        data={posts}
        numColumns={2}
        keyExtractor={(item, idx) => item.postId || String(idx)}
        contentContainerStyle={{ paddingBottom: 20 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item }) => {
          let imagesArr = item.images;
          if (typeof imagesArr === 'string') {
            try { imagesArr = JSON.parse(imagesArr); }
            catch { imagesArr = imagesArr ? [imagesArr] : []; }
          }
          return (
            <PostCard
              key={item.postId}
              {...item}
              images={imagesArr}
              image={{ uri: imagesArr?.length > 0 ? imagesArr[0] : (item.imageUri || '') }}
              userId={item.userId || item.postOwnerUid}
            />
          );
        }}
      />
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#ffffff' }}>
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
            <Text style={[styles.tabLabel, activeTab === 'found' && styles.tabLabelActive]}>พบของ</Text>
            {activeTab === 'found' && <View style={styles.tabIndicator} />}
          </Pressable>
          <Pressable style={styles.tabItem} onPress={() => setActiveTab('lost')}>
            <Text style={[styles.tabLabel, activeTab === 'lost' && styles.tabLabelActive]}>ของหาย</Text>
            {activeTab === 'lost' && <View style={styles.tabIndicator} />}
          </Pressable>
        </View>
      </SafeAreaView>

      {/* CONTENT */}
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: '#FFFAF5' }}>
        <View style={styles.content}>
          {renderContent()}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#ffffff' },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabLabel: { fontSize: 15, fontWeight: '600', color: '#999' },
  tabLabelActive: { color: '#F97316' },
  tabIndicator: {
    position: 'absolute', bottom: 0, height: 3,
    width: '50%', backgroundColor: '#F97316', borderRadius: 2,
  },
  content: { flex: 1, padding: 10 },
  emptyText: { textAlign: 'center', marginTop: 30 },
});