import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, getFirestore, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { app } from '../../constants/firebase';

interface ChatRoom {
  chatId: string;
  targetUid: string;
  targetName: string;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
}

export default function ChatScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatRoom[]>([]);

  useEffect(() => {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore(app);
    const q = query(
      collection(db, 'chats'),
      where('members', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsub = onSnapshot(q, snap => {
      const data: ChatRoom[] = snap.docs.map(doc => {
        const d = doc.data();
        const targetUid = d.members.find((uid: string) => uid !== user.uid) || '';
        const unreadCount = d.unreadCount?.[user.uid] || 0;
        return {
          chatId: doc.id,
          targetUid,
          targetName: d.memberNames?.[targetUid] || '-',
          lastMessage: d.lastMessage || '',
          updatedAt: d.updatedAt || '',
          unreadCount,
        };
      });
      setChats(data);
    });

    return () => unsub();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFFAF5', '#ffffff']} style={styles.header}>
        <Text style={styles.headerTitle}>แชท</Text>
      </LinearGradient>

      {chats.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubble-ellipses-outline" size={48} color="#ddd" />
          <Text style={styles.emptyText}>ยังไม่มีแชทค่ะ</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={item => item.chatId}
          contentContainerStyle={{ paddingTop: 0 }}
          renderItem={({ item }) => (
        <TouchableOpacity
            style={[
              styles.chatItem,
              item.unreadCount > 0 && styles.chatItemUnread // ✅ เพิ่มตรงนี้
            ]}
            onPress={() => router.push({
              pathname: '../../chat/[id]',
              params: {
                targetUid: item.targetUid,
                targetName: item.targetName,
                postTitle: '',
              }
            })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.targetName !== '-' ? item.targetName[0].toUpperCase() : '?'}
              </Text>
            </View>
            <View style={styles.textContainer}>
              {/* ✅ ชื่อหนาขึ้นถ้ายังไม่อ่าน */}
              <Text style={[styles.name, item.unreadCount > 0 && { color: '#1A1A1A', fontWeight: '700' }]}>
                {item.targetName}
              </Text>
              {/* ✅ ข้อความหนาขึ้นถ้ายังไม่อ่าน */}
              <Text style={[styles.message, item.unreadCount > 0 && { color: '#333', fontWeight: '600' }]} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            </View>
            {item.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFAF5' },
  header: { paddingTop: 70, paddingBottom: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E0D6CC' },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#5A4633' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: '#bbb' },
  chatItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 15,
    borderBottomWidth: 1, borderBottomColor: '#E0D6CC', backgroundColor: '#fff',
  },
  avatar: {
    width: 45, height: 45, borderRadius: 23,
    backgroundColor: '#f8e8dc', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#6E4D31' },
  textContainer: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#5A4633' },
  message: { fontSize: 13, color: '#888', marginTop: 2 },
  badge: {
  backgroundColor: '#F97316',
  borderRadius: 12,
  minWidth: 22,
  height: 22,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 6,
},
badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
chatItemUnread: {
  backgroundColor: '#FFF3E8', // ✅ พื้นหลังสีส้มอ่อนๆ
  borderLeftWidth: 3,
  borderLeftColor: '#F97316', // ✅ เส้นซ้ายสีส้ม
},
});