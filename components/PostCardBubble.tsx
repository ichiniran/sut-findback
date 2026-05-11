// components/PostCardBubble.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PostCardBubbleProps {
  postId: string;
  postTitle: string;
  postType: "found" | "lost";
  postStatus: "waiting" | "claimed";
  postImageUri?: string;
  postLocationName?: string;
  postDate?: string;
  isSentByMe: boolean;
}

export default function PostCardBubble({
  postId,
  postTitle,
  postType,
  postStatus,
  postImageUri,
  postLocationName,
  postDate,
  isSentByMe,
}: PostCardBubbleProps) {
  const router = useRouter();
  const isFound = postType === "found";

  return (
    <TouchableOpacity
      style={[styles.card, isSentByMe ? styles.cardRight : styles.cardLeft]}
      activeOpacity={0.85}
      onPress={() =>
        router.push({ pathname: "../post-detail", params: { postId } })
      }
    >
      {/* Header strip */}
      <View
        style={[
          styles.strip,
          { backgroundColor: isFound ? "#fff7ed" : "#fef2f2" },
        ]}
      >
        <Ionicons
          name={isFound ? "search" : "alert-circle-outline"}
          size={12}
          color={isFound ? "#F97316" : "#ef4444"}
        />
        <Text
          style={[styles.stripText, { color: isFound ? "#F97316" : "#ef4444" }]}
        >
          {isFound ? "โพสต์พบของ" : "โพสต์ของหาย"}
        </Text>
        <View style={styles.dot} />
        <Text
          style={[
            styles.stripText,
            {
              color: postStatus === "claimed" ? "#16a34a" : "#F97316",
            },
          ]}
        >
          {postStatus === "claimed" ? "มีคนรับแล้ว" : "รอดำเนินการ"}
        </Text>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {postImageUri ? (
          <Image
            source={{ uri: postImageUri }}
            style={styles.thumb}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Ionicons name="image-outline" size={20} color="#d4b89a" />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {postTitle || "-"}
          </Text>
          {postLocationName ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={11} color="#a0856a" />
              <Text style={styles.meta} numberOfLines={1}>
                {postLocationName}
              </Text>
            </View>
          ) : null}
          {postDate ? (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={11} color="#a0856a" />
              <Text style={styles.meta}>{postDate}</Text>
            </View>
          ) : null}
          <Text style={styles.postIdText}>#{postId?.slice(0, 8)}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>แตะเพื่อดูรายละเอียด</Text>
        <Ionicons name="chevron-forward" size={12} color="#a0856a" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 260,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0e6dc",
    shadowColor: "#5A4633",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginVertical: 2,
  },
  cardRight: { alignSelf: "flex-end" },
  cardLeft: { alignSelf: "flex-start" },
  strip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stripText: { fontSize: 11, fontWeight: "700" },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#d4b89a" },
  body: { flexDirection: "row", padding: 10, gap: 10 },
  thumb: { width: 64, height: 64, borderRadius: 10 },
  thumbPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: "#fdf0e8",
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, gap: 4 },
  title: { fontSize: 13, fontWeight: "700", color: "#3d2b1f", lineHeight: 18 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  meta: { fontSize: 11, color: "#a0856a", flex: 1 },
  postIdText: {
    fontSize: 10,
    color: "#c8a882",
    marginTop: 2,
    fontFamily: "monospace",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: "#fdf0e8",
    backgroundColor: "#fffaf7",
  },
  footerText: { fontSize: 11, color: "#a0856a", fontWeight: "600" },
});
