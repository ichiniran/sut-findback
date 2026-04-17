import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import {
  addDoc, collection, getFirestore,
  onSnapshot, orderBy, query,
  serverTimestamp,
  where,
  writeBatch
} from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList, Image, Keyboard, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { app } from '../../constants/firebase';

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  receiverId: string;
  text?: string;
  isRead: boolean;
  createdAt: any;
  type?: string;
  postId?: string;
  postType?: string;
  title?: string;
  locationName?: string;
  date?: string;
  imageUri?: string;
  detail?: string;
  location?: string;
  locationDetail?: string;
  receiveLocation?: string;
  username?: string;
  userId?: string;
  images?: string;
  category?: string;
  latitude?: string;
  longitude?: string;
  currentStatus?: string;
}

export default function ChatDetail() {
  const router = useRouter();
  const { targetUid, targetName, postTitle,
    postId, postType, postImageUri, postLocationName, postDate,
    postDetail, postLocation, postLocationDetail, postReceiveLocation,
    postUsername, postUserId, postImages, postCategory,
    postLatitude, postLongitude, postCurrentStatus,
  } = useLocalSearchParams<Record<string, string>>();

  const [postCardSent, setPostCardSent] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const auth = getAuth(app);
  const currentUser = auth.currentUser;
  const db = getFirestore(app);
  const roomId = [currentUser?.uid, targetUid].sort().join('_');

  useEffect(() => {
    setPostCardSent(false);
  }, [postId]);

  useEffect(() => {
    if (!currentUser) return;

    // ✅ ดึงข้อความทั้งหมดใน roomId นี้ (เหมือน Swift)
    const q = query(
      collection(db, 'chats'),
      where('roomId', '==', roomId),
      orderBy('createdAt', 'asc')
    );

     const unsub = onSnapshot(q, async snap => {
        const data: Message[] = snap.docs
        .map(d => ({ id: d.id, ...d.data() as Omit<Message, 'id'> }))
        // ✅ กรองข้อความที่ถูกซ่อนออก
        .filter(msg => {
        const hiddenFor = (msg as any).hiddenFor as string[] ?? [];
        return !hiddenFor.includes(currentUser.uid);
        });

    setMessages(data);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      // ✅ mark as read (เหมือน Swift markAsRead)
      const batch = writeBatch(db);
      snap.docs.forEach(d => {
        const msg = d.data();
        if (msg.receiverId === currentUser.uid && msg.isRead === false) {
          batch.update(d.ref, { isRead: true });
        }
      });
      await batch.commit();
    });

    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => keyboardDidShowListener?.remove();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !currentUser) return;
    const text = input.trim();
    setInput('');

    // ✅ ส่ง post_card ก่อน (ถ้ามี)
    if (!postCardSent && postId) {
      await addDoc(collection(db, 'chats'), {
        roomId,
        senderId: currentUser.uid,
        receiverId: targetUid,
        isRead: false,
        createdAt: serverTimestamp(),
        type: 'post_card',
        postId,
        postType,
        title: postTitle || '',
        locationName: postLocationName || '',
        date: postDate || '',
        imageUri: postImageUri || '',
        detail: postDetail || '',
        location: postLocation || '',
        locationDetail: postLocationDetail || '',
        receiveLocation: postReceiveLocation || '',
        username: postUsername || '',
        userId: postUserId || '',
        images: postImages || '',
        category: postCategory || '',
        latitude: postLatitude || '',
        longitude: postLongitude || '',
        currentStatus: postCurrentStatus || '',
        participants: [currentUser.uid, targetUid],
        senderName: currentUser.displayName || 'ฉัน',
        receiverName: targetName || '-',
        hiddenFor: [],
      });
      setPostCardSent(true);
    }

    // ✅ ส่งข้อความปกติ (schema เหมือน Swift)
    await addDoc(collection(db, 'chats'), {
      roomId,
      senderId: currentUser.uid,
      receiverId: targetUid,
      text,
      isRead: false,
      createdAt: serverTimestamp(),
      participants: [currentUser.uid, targetUid],
      senderName: currentUser.displayName || 'ฉัน',
      receiverName: targetName || '-',
      hiddenFor: [],
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#5A4633" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerName}>{targetName || '-'}</Text>
              {postTitle ? <Text style={styles.headerSub} numberOfLines={1}>{postTitle}</Text> : null}
            </View>
          </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              const isMe = item.senderId === currentUser?.uid;

              if (item.type === 'post_card') {
                return (
                  <View style={[styles.bubbleWrap, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                    <TouchableOpacity
                      style={styles.postCard}
                      activeOpacity={0.85}
                      onPress={() => router.push({
                        pathname: '/post-detail',
                        params: {
                          postId: item.postId || '',
                          title: item.title || '',
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
                          type: item.postType || '',
                        }
                      })}
                    >
                      {item.imageUri ? (
                        <Image source={{ uri: item.imageUri }} style={styles.postCardImage} resizeMode="cover" />
                      ) : null}
                      <View style={styles.postCardBody}>
                        <View style={[styles.postCardBadge, {
                          backgroundColor: item.postType === 'found' ? '#F97316' : '#EF4444'
                        }]}>
                          <Text style={styles.postCardBadgeText}>
                            {item.postType === 'found' ? 'พบของ' : 'ของหาย'}
                          </Text>
                        </View>
                        <Text style={styles.postCardTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.postCardSub}>📍 {item.locationName}</Text>
                        <Text style={styles.postCardSub}>📅 {item.date}</Text>
                        <Text style={styles.postCardTap}>แตะเพื่อดูรายละเอียด →</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              }

              return (
                <View style={[styles.bubbleWrap, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                  <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                    <Text style={[styles.bubbleText, isMe && { color: '#fff' }]}>{item.text}</Text>
                  </View>
                </View>
              );
            }}
          />

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="พิมพ์ข้อความ..."
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, !input.trim() && { backgroundColor: '#ccc', opacity: 0.5 }]}
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', gap: 8,
  },
  backBtn: { padding: 4 },
  headerName: { fontSize: 15, fontWeight: '700', color: '#5A4633' },
  headerSub: { fontSize: 11, color: '#aaa', marginTop: 1 },
  messageList: { padding: 16, gap: 8 },
  bubbleWrap: { flexDirection: 'row', marginVertical: 3 },
  bubbleLeft: { justifyContent: 'flex-start' },
  bubbleRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMe: { backgroundColor: '#F97316', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#eee' },
  bubbleText: { fontSize: 14, color: '#333', lineHeight: 20 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 10, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#eee', gap: 8, paddingBottom: 10,
  },
  input: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, maxHeight: 100, borderColor: '#bbbbbb', borderWidth: 1,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center',
  },
  postCard: {
    width: 220, borderRadius: 14, overflow: 'hidden',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  postCardImage: { width: '100%', height: 120 },
  postCardBody: { padding: 10, gap: 4 },
  postCardBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, marginBottom: 4,
  },
  postCardBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  postCardTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
  postCardSub: { fontSize: 12, color: '#888' },
  postCardTap: { fontSize: 11, color: '#F97316', marginTop: 4, fontWeight: '500' },
});