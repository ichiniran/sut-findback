import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { app } from "../../constants/firebase";

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  receiverId: string;
  text?: string;
  isRead: boolean;
  createdAt: any;
  type?: string;
  imageUrl?: string;
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

// ── Cloudinary upload (เหมือนใน PostForm) ──────────────────────────────────
const uploadToCloudinary = async (localUri: string): Promise<string> => {
  if (localUri.startsWith("http")) return localUri;
  const formData = new FormData();
  formData.append("file", {
    uri: localUri,
    type: "image/jpeg",
    name: "photo.jpg",
  } as any);
  formData.append("upload_preset", "nxbvgcct");
  formData.append("cloud_name", "dto2v8z6t");
  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dto2v8z6t/image/upload",
    { method: "POST", body: formData },
  );
  const data = await res.json();
  if (!data.secure_url) throw new Error("Upload failed");
  return data.secure_url;
};

export default function ChatDetail() {
  const router = useRouter();
  const {
    targetUid,
    targetName,
    postTitle,
    postId,
    postType,
    postImageUri,
    postLocationName,
    postDate,
    postDetail,
    postLocation,
    postLocationDetail,
    postReceiveLocation,
    postUsername,
    postUserId,
    postImages,
    postCategory,
    postLatitude,
    postLongitude,
    postCurrentStatus,
  } = useLocalSearchParams<Record<string, string>>();

  const [postCardSent, setPostCardSent] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null); // รูปที่เลือกแต่ยังไม่ส่ง
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // รูปที่กดเปิดดูเต็มจอ
  const flatListRef = useRef<FlatList>(null);

  const auth = getAuth(app);
  const currentUser = auth.currentUser;
  const db = getFirestore(app);
  const roomId = [currentUser?.uid, targetUid].sort().join("_");
  const [myUsername, setMyUsername] = useState("ฉัน");

  useEffect(() => {
    const fetchMyUsername = async () => {
      if (!currentUser) return;
      const snap = await getDoc(doc(db, "users", currentUser.uid));
      if (snap.exists()) setMyUsername(snap.data().username || "ฉัน");
    };
    fetchMyUsername();
  }, []);

  useEffect(() => {
    setPostCardSent(false);
  }, [postId]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "chats"),
      where("roomId", "==", roomId),
      orderBy("createdAt", "asc"),
    );
    const unsub = onSnapshot(q, async (snap) => {
      const data: Message[] = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Message, "id">) }))
        .filter((msg) => {
          const hiddenFor = ((msg as any).hiddenFor as string[]) ?? [];
          return !hiddenFor.includes(currentUser.uid);
        });
      setMessages(data);
      const hasPostCard = data.some(
        (msg) => msg.type === "post_card" && msg.postId === postId,
      );

      if (hasPostCard) {
        setPostCardSent(true); // ✅ ถ้ามีอยู่แล้ว mark ว่า sent แล้ว (ไม่ต้องส่งซ้ำ)
      }
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );

      const batch = writeBatch(db);
      snap.docs.forEach((d) => {
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
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100,
        );
      },
    );
    return () => keyboardDidShowListener?.remove();
  }, []);

  // ── เลือกรูปจาก gallery ───────────────────────────────────────────────────
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      setPendingImage(manipulated.uri);
    }
  };

  // ── ส่งข้อความ / รูป ─────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!currentUser) return;
    const hasText = input.trim().length > 0;
    const hasImage = !!pendingImage;
    if (!hasText && !hasImage) return;

    setUploading(true);
    const text = input.trim();
    setInput("");
    const imageToSend = pendingImage;
    setPendingImage(null);

    try {
      // ส่ง post_card ก่อน (ถ้ามี)
      if (!postCardSent && postId) {
        await addDoc(collection(db, "chats"), {
          roomId,
          senderId: currentUser.uid,
          receiverId: targetUid,
          isRead: false,
          createdAt: serverTimestamp(),
          type: "post_card",
          postId,
          postType,
          title: postTitle || "",
          locationName: postLocationName || "",
          date: postDate || "",
          imageUri: postImageUri || "",
          detail: postDetail || "",
          location: postLocation || "",
          locationDetail: postLocationDetail || "",
          receiveLocation: postReceiveLocation || "",
          username: postUsername || "",
          userId: postUserId || "",
          images: postImages || "",
          category: postCategory || "",
          latitude: postLatitude || "",
          longitude: postLongitude || "",
          currentStatus: postCurrentStatus || "",
          participants: [currentUser.uid, targetUid],
          senderName: myUsername,
          receiverName: targetName || "-",
          hiddenFor: [],
        });
        setPostCardSent(true);
      }

      // ส่งรูปภาพ
      if (imageToSend) {
        const imageUrl = await uploadToCloudinary(imageToSend);
        await addDoc(collection(db, "chats"), {
          roomId,
          senderId: currentUser.uid,
          receiverId: targetUid,
          isRead: false,
          createdAt: serverTimestamp(),
          type: "image",
          imageUrl,
          participants: [currentUser.uid, targetUid],
          senderName: myUsername,
          receiverName: targetName || "-",
          hiddenFor: [],
        });
      }

      // ส่งข้อความปกติ
      if (text) {
        await addDoc(collection(db, "chats"), {
          roomId,
          senderId: currentUser.uid,
          receiverId: targetUid,
          text,
          isRead: false,
          createdAt: serverTimestamp(),
          participants: [currentUser.uid, targetUid],
          senderName: myUsername,
          receiverName: targetName || "-",
          hiddenFor: [],
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const canSend = (input.trim().length > 0 || !!pendingImage) && !uploading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={22} color="#5A4633" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerName}>{targetName || "-"}</Text>
              {postTitle ? (
                <Text style={styles.headerSub} numberOfLines={1}>
                  {postTitle}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            renderItem={({ item }) => {
              const isMe = item.senderId === currentUser?.uid;

              // ── post_card ──────────────────────────────────────────────────
              if (item.type === "post_card") {
                return (
                  <View
                    style={[
                      styles.bubbleWrap,
                      isMe ? styles.bubbleRight : styles.bubbleLeft,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.postCard}
                      activeOpacity={0.85}
                      onPress={() =>
                        router.push({
                          pathname: "/post-detail",
                          params: {
                            postId: item.postId || "",
                            title: item.title || "",
                            detail: item.detail || "",
                            location: item.location || "",
                            locationName: item.locationName || "",
                            locationDetail: item.locationDetail || "",
                            receiveLocation: item.receiveLocation || "",
                            username: item.username || "",
                            userId: item.userId || "",
                            date: item.date || "",
                            images: item.images || "",
                            category: item.category || "",
                            latitude: item.latitude || "",
                            longitude: item.longitude || "",
                            currentStatus: item.currentStatus || "",
                            type: item.postType || "",
                          },
                        })
                      }
                    >
                      {item.imageUri ? (
                        <Image
                          source={{ uri: item.imageUri }}
                          style={styles.postCardImage}
                          resizeMode="cover"
                        />
                      ) : null}
                      <View style={styles.postCardBody}>
                        <View
                          style={[
                            styles.postCardBadge,
                            {
                              backgroundColor:
                                item.postType === "found"
                                  ? "#ff995e"
                                  : "#ff5e5e",
                            },
                          ]}
                        >
                          <Text style={styles.postCardBadgeText}>
                            {item.postType === "found" ? "พบของ" : "ของหาย"}
                          </Text>
                        </View>
                        <Text style={styles.postCardTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 4,
                          }}
                        >
                          <Ionicons
                            name="location-outline"
                            size={16}
                            color="#ff995e"
                          />
                          <Text style={[styles.postCardSub, { marginLeft: 6 }]}>
                            {item.locationName}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 2,
                          }}
                        >
                          <Ionicons
                            name="calendar-outline"
                            size={16}
                            color="#ff995e"
                          />
                          <Text style={[styles.postCardSub, { marginLeft: 6 }]}>
                            {item.date}
                          </Text>
                        </View>
                        <Text style={styles.postCardTap}>
                          แตะเพื่อดูรายละเอียด →
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              }

              // ── image bubble ───────────────────────────────────────────────
              if (item.type === "image") {
                return (
                  <View
                    style={[
                      styles.bubbleWrap,
                      isMe ? styles.bubbleRight : styles.bubbleLeft,
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setSelectedImage(item.imageUrl ?? null)}
                      style={[
                        styles.imageBubble,
                        isMe ? styles.imageBubbleMe : styles.imageBubbleThem,
                      ]}
                    >
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.chatImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  </View>
                );
              }

              // ── text bubble ────────────────────────────────────────────────
              return (
                <View
                  style={[
                    styles.bubbleWrap,
                    isMe ? styles.bubbleRight : styles.bubbleLeft,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.bubbleMe : styles.bubbleThem,
                    ]}
                  >
                    <Text
                      style={[styles.bubbleText, isMe && { color: "#fff" }]}
                    >
                      {item.text}
                    </Text>
                  </View>
                </View>
              );
            }}
          />

          {/* Image preview แบบ Line — แถบอยู่เหนือ input bar */}
          {pendingImage && (
            <View style={styles.previewBar}>
              <View style={styles.previewThumbWrap}>
                <Image
                  source={{ uri: pendingImage }}
                  style={styles.previewThumb}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.previewRemove}
                  onPress={() => setPendingImage(null)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close-circle" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Input row */}
          <View style={styles.inputRow}>
            {/* ปุ่มเลือกรูป */}
            <TouchableOpacity
              style={styles.imageBtn}
              onPress={handlePickImage}
              disabled={uploading}
            >
              <Ionicons name="image-outline" size={24} color="#F97316" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="พิมพ์ข้อความ..."
              placeholderTextColor="#999"
              value={input}
              onChangeText={setInput}
              multiline
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                !canSend && { backgroundColor: "#ccc", opacity: 0.5 },
              ]}
              onPress={handleSend}
              disabled={!canSend}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          {/* Full-screen image viewer */}
          <Modal
            visible={!!selectedImage}
            transparent
            animationType="fade"
            onRequestClose={() => setSelectedImage(null)}
            statusBarTranslucent
          >
            <View style={styles.modalBg}>
              <StatusBar hidden />
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              )}
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerName: { fontSize: 15, fontWeight: "700", color: "#5A4633" },
  headerSub: { fontSize: 11, color: "#aaa", marginTop: 1 },
  messageList: { padding: 16, gap: 8 },
  bubbleWrap: { flexDirection: "row", marginVertical: 3 },
  bubbleLeft: { justifyContent: "flex-start" },
  bubbleRight: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMe: { backgroundColor: "#F97316", borderBottomRightRadius: 4 },
  bubbleThem: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#eee",
  },
  bubbleText: { fontSize: 14, color: "#333", lineHeight: 20 },

  // ── image bubble ───────────────────────────────────────────────────────────
  imageBubble: { borderRadius: 14, overflow: "hidden", maxWidth: 220 },
  imageBubbleMe: { borderBottomRightRadius: 4 },
  imageBubbleThem: { borderBottomLeftRadius: 4 },
  chatImage: { width: 220, height: 220 },

  // ── preview bar (แบบ Line) ─────────────────────────────────────────────────
  previewBar: {
    backgroundColor: "#f5f5f5",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  previewThumbWrap: {
    position: "relative",
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: "visible",
  },
  previewThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },
  previewRemove: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 12,
  },

  // ── input row ──────────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 8,
    paddingBottom: 10,
  },
  imageBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    borderColor: "#bbbbbb",
    borderWidth: 1,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── post card ──────────────────────────────────────────────────────────────
  postCard: {
    width: 220,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  postCardImage: { width: "100%", height: 120 },
  postCardBody: { padding: 10, gap: 4 },
  postCardBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 4,
  },
  postCardBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  postCardTitle: { fontSize: 14, fontWeight: "700", color: "#333" },
  postCardSub: { fontSize: 12, color: "#888" },
  postCardTap: {
    fontSize: 11,
    color: "#F97316",
    marginTop: 4,
    fontWeight: "500",
  },

  // ── full-screen viewer ────────────────────────────────────────────────────
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.73)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalClose: {
    position: "absolute",
    top: 52,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 6,
  },
});
