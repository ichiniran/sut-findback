import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getFirestore, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { app } from '../../constants/firebase';

export default function NotifyScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = useRouter();
  const db = getFirestore(app);

  // 🔥 โหลด notification realtime
  useEffect(() => {
    const auth = getAuth(app);
    const user = auth.currentUser;

    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(data);
    });

    return () => unsub();
  }, []);

    //ฟ้งก์ชันลบ notification
      const handleDelete = (id: string) => {
        Alert.alert('ลบการแจ้งเตือน', 'ต้องการลบการแจ้งเตือนนี้หรือไม่?', [
          { text: 'ยกเลิก', style: 'cancel' },
          {
            text: 'ลบ',
            style: 'destructive',
            onPress: async () => {
              const auth = getAuth(app);
              const user = auth.currentUser;
              if (!user) return;
              await deleteDoc(doc(db, 'users', user.uid, 'notifications', id));
            },
          },
        ]);
      };




  // 🔥 กด notification → ไปหน้า PostDetail พร้อมส่ง postId + type
  const handlePress = async (item: any) => {
    const auth = getAuth(app);
    const user = auth.currentUser;

    if (!user) return;

    try {
      // mark as read
      await updateDoc(
        doc(db, 'users', user.uid, 'notifications', item.id),
        { isRead: true }
      );

      if (!item.postId) return;
      const postSnap = await getDoc(doc(db, 'posts', item.postId));
      if (!postSnap.exists() || postSnap.data()?.status === 'rejected') {
      Alert.alert(
        'ไม่พบโพสต์',
        'โพสต์นี้ถูกลบไปแล้ว',
        [{ text: 'ตกลง', style: 'cancel' }]
      );
      return;
    }
      router.push({
        pathname: '/post-detail',
        params: {
          postId: item.postId,
          type: item.type || 'found', 
          title: item.postTitle || '',
          detail: item.detail || '',
          location: item.location || '',
          locationName: item.locationName || '',
          locationDetail: item.locationDetail || '',
          receiveLocation: item.receiveLocation || '',
          username: item.username || '',
          userId: item.userId || '',
          date: item.date || '',
          images: item.images || '',
          category: item.category || '',
          latitude: item.latitude || '',
          longitude: item.longitude || '',
          currentStatus: item.currentStatus || '',
              },
      });

    } catch (e) {
      console.log(e);
    }
  };

  //  format เวลา
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';

    const now = new Date();
    const time = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diff < 60) return 'เมื่อสักครู่';
    if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;

    return `${Math.floor(diff / 86400)} วันที่แล้ว`;
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <LinearGradient
        colors={['#FFFAF5', '#ffffff']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>การแจ้งเตือน</Text>
      </LinearGradient>

      {/* EMPTY */}
      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>ยังไม่มีการแจ้งเตือน</Text>
        </View>
      ) : (

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (

            <TouchableOpacity
              style={[styles.item, !item.isRead && styles.unreadItem]}
              onPress={() => handlePress(item)}
              onLongPress={() => handleDelete(item.id)}
              delayLongPress={400}
            >

              {/* ✅ รูปโพสต์ (ซ้าย) */}
              {item.itemImage?.trim() ? (
              <Image
                source={{ uri: item.itemImage }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : item.type === 'report_reviewed' ? (
              // notification แจ้งเตือน report → แสดงธง
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name="flag"
                  size={28}
                  color="#F97316"
                />
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name="image-outline"
                  size={36}
                  color="rgba(63, 63, 63, 0.4)"
                />
              </View>
            )}

              {/* TEXT */}
              <View style={styles.textContainer}>
                <Text style={styles.title}>
                  {item.title || 'มีการแจ้งเตือน'}
                </Text>
                <Text style={styles.desc}>
                  {item.desc}
                </Text>

                {/* เวลา */}
                <Text style={styles.time}>
                  {formatTime(item.createdAt)}
                </Text>
              </View>

              
              {!item.isRead && <View style={styles.dot} />}

            </TouchableOpacity>

          )}
        />

      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFAF5',
  },

  header: {
    paddingTop: 70,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#E0D6CC',
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#5A4633',
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D6CC',
    backgroundColor: '#fff',
  },

  unreadItem: {
    backgroundColor: '#FFF3E6',
  },

  image: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 12,
  },

  imagePlaceholder: {
  width: 50,
  height: 50,
  borderRadius: 12,
  justifyContent: "center",
  alignItems: "center",
  marginRight: 12,
},
  textContainer: {
    flex: 1,
  },

  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5A4633',
  },

  desc: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },

  time: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 4,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: '#F97316',
    position: 'absolute',
    right: 12,
    top: 12,
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    color: '#999',
    fontSize: 14,
  },
});
