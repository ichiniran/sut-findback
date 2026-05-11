import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { app } from "../../constants/firebase";

interface ChatRoom {
  roomId: string;
  targetUid: string;
  targetName: string;
  targetPhoto?: string;
  lastMessage: string;
  updatedAt: Date;
  hasUnread: boolean;
}

// ── helper: แปลง lastMessage ให้แสดงผลสวย ──────────────────────────────────
function formatLastMessage(text: string): string {
  if (!text || text.trim() === "") return "ส่งรูปภาพ";
  return text;
}

export default function ChatScreen() {
  const [resolvedChats, setResolvedChats] = useState<ChatRoom[]>([]);
  const router = useRouter();
  const [chats, setChats] = useState<ChatRoom[]>([]);

  useEffect(() => {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore(app);

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(q, (snap) => {
      const chatDict: Record<string, ChatRoom> = {};

      snap.docs.forEach((d) => {
        const data = d.data();
        const roomId = data.roomId as string;
        const senderId = data.senderId as string;
        const receiverId = data.receiverId as string;
        const createdAt = data.createdAt?.toDate() ?? new Date();
        const isRead = (data.isRead as boolean) ?? true;

        // ── สร้าง lastMessage ตาม type ──────────────────────────────────────
        let text: string;
        if (data.type === "image") {
          text = "ส่งรูปภาพ";
        } else if (data.type === "post_card") {
          text = `📌 ${data.title}`;
        } else {
          text = (data.text as string) || "";
        }

        const isMeSender = senderId === user.uid;
        const targetUid = isMeSender ? receiverId : senderId;
        const targetName = isMeSender
          ? ((data.receiverName as string) ?? "-")
          : ((data.senderName as string) ?? "-");

        const hiddenFor = (data.hiddenFor as string[]) ?? [];
        if (hiddenFor.includes(user.uid)) return;

        const unread = !isMeSender && !isRead;

        if (chatDict[roomId]) {
          if (createdAt > chatDict[roomId].updatedAt) {
            chatDict[roomId].lastMessage = text;
            chatDict[roomId].updatedAt = createdAt;
            chatDict[roomId].targetUid = targetUid;
            chatDict[roomId].targetName = targetName;
          }
          if (unread) chatDict[roomId].hasUnread = true;
        } else {
          chatDict[roomId] = {
            roomId,
            targetUid,
            targetName,
            lastMessage: text,
            updatedAt: createdAt,
            hasUnread: unread,
          };
        }
      });

      const sorted = Object.values(chatDict).sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
      );
      setChats(sorted);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (chats.length === 0) {
      setResolvedChats([]);
      return;
    }

    const db = getFirestore(app);

    const unsubscribers: (() => void)[] = [];

    chats.forEach((chat) => {
      const unsub = onSnapshot(doc(db, "users", chat.targetUid), (snap) => {
        const data = snap.data();

        setResolvedChats((prev) => {
          const others = prev.filter((p) => p.roomId !== chat.roomId);

          return [
            ...others,
            {
              ...chat,
              targetName: data?.username || chat.targetName,

              targetPhoto: data?.photoURL || data?.profileImage || "",
            },
          ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        });
      });

      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach((u) => u());
    };
  }, [chats]);

  const handleLongPress = (item: ChatRoom) => {
    Alert.alert("ลบแชท", `ต้องการลบแชทกับ ${item.targetName} หรือไม่`, [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบแชท",
        style: "destructive",
        onPress: () => handleDeleteChat(item),
      },
    ]);
  };

  const handleDeleteChat = async (item: ChatRoom) => {
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore(app);
      const q = query(
        collection(db, "chats"),
        where("roomId", "==", item.roomId),
      );
      const snap = await getDocs(q);
      await Promise.all(
        snap.docs.map((d) =>
          updateDoc(d.ref, { hiddenFor: arrayUnion(user.uid) }),
        ),
      );

      setChats((prev) => prev.filter((c) => c.roomId !== item.roomId));

      setResolvedChats((prev) => prev.filter((c) => c.roomId !== item.roomId));
    } catch (err) {
      console.log("ลบไม่สำเร็จ", err);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#FFFAF5", "#ffffff"]} style={styles.header}>
        <Text style={styles.headerTitle}>แชท</Text>
      </LinearGradient>

      {resolvedChats.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubble-ellipses-outline" size={48} color="#ddd" />
          <Text style={styles.emptyText}>ยังไม่มีแชทค่ะ</Text>
        </View>
      ) : (
        <FlatList
          data={resolvedChats}
          keyExtractor={(item) => item.roomId}
          contentContainerStyle={{ paddingTop: 0 }}
          renderItem={({ item }) => {
            const isImageMsg = item.lastMessage === "📷 ส่งรูปภาพ";
            return (
              <TouchableOpacity
                style={[
                  styles.chatItem,
                  item.hasUnread && styles.chatItemUnread,
                ]}
                onLongPress={() => handleLongPress(item)}
                onPress={() =>
                  router.push({
                    pathname: "../../chat/ChatDetail",
                    params: {
                      targetUid: item.targetUid,
                      targetName: item.targetName,
                      postTitle: "",
                    },
                  })
                }
              >
                <View style={styles.avatar}>
                  {item.targetPhoto ? (
                    <Image
                      source={{ uri: item.targetPhoto }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {item.targetName !== "-"
                        ? item.targetName[0].toUpperCase()
                        : "?"}
                    </Text>
                  )}
                </View>
                <View style={styles.textContainer}>
                  <Text
                    style={[
                      styles.name,
                      item.hasUnread && { color: "#1A1A1A", fontWeight: "700" },
                    ]}
                  >
                    {item.targetName}
                  </Text>
                  <Text
                    style={[
                      styles.message,
                      item.hasUnread && { color: "#333", fontWeight: "600" },
                      isImageMsg && { color: "#F97316", fontStyle: "italic" },
                    ]}
                    numberOfLines={1}
                  >
                    {item.lastMessage}
                  </Text>
                </View>
                {item.hasUnread && <View style={styles.dot} />}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFAF5" },
  header: {
    paddingTop: 70,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0D6CC",
  },
  headerTitle: { fontSize: 22, fontWeight: "600", color: "#5A4633" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 14, color: "#bbb" },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0D6CC",
    backgroundColor: "#fff",
  },
  avatarImage: {
    width: 45,
    height: 45,
    borderRadius: 23,
  },
  chatItemUnread: { backgroundColor: "#FFF3E8" },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#f8e8dc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#6E4D31" },
  textContainer: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: "#5A4633" },
  message: { fontSize: 13, color: "#888", marginTop: 2 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F97316",
  },
});
