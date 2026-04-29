import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  collection,
  getFirestore,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PostCard from "../components/PostCard";
import { app } from "../constants/firebase";

export default function ClaimedPostsScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    const db = getFirestore(app);
    const q = query(
      collection(db, "posts"),
      where("claimedBy", "==", uid),
      where("status", "==", "claimed"),
      where("type", "==", "found"),
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ postId: d.id, ...d.data() }));
      setPosts(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color="#2d1b10" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>รายการรับของของฉัน</Text>
          <View style={{ width: 36 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <Text style={styles.empty}>กำลังโหลด...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.empty}>ยังไม่มีรายการรับของ</Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.postId}
            numColumns={2}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <PostCard
                postId={item.postId}
                userId={item.userId}
                type={item.type}
                image={{ uri: item.images?.[0] || "" }}
                images={item.images}
                receiveLocationImage={item.receiveLocationImage}
                title={item.category || "-"}
                detail={item.detail}
                location={item.location}
                locationName={item.locationName}
                locationDetail={item.locationDetail}
                receiveLocation={item.receiveLocation}
                username={item.username}
                date={item.date}
                createdAt={item.createdAt}
                category={item.category}
                latitude={item.latitude}
                longitude={item.longitude}
                currentStatus={item.status}
              />
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFAF5",
    flex: 1,
  },
  header: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 10,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d1b10",
  },
  list: { padding: 8 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 60,
    gap: 12,
  },
  empty: { fontSize: 14, color: "#a0856a" },
});
