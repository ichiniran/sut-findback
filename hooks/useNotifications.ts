import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect } from "react";
import { app } from "../constants/firebase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotificationListener() {
  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    let unsubSnapshot: (() => void) | null = null;
    let unsubChat: (() => void) | null = null; // ✅ เพิ่ม

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubSnapshot?.();
      unsubSnapshot = null;
      unsubChat?.(); // ✅ cleanup chat
      unsubChat = null;

      if (!user) return;

      // ── Notification listener (เดิม) ──
      let isFirstNotify = true;
      const q = query(
        collection(db, "users", user.uid, "notifications"),
        where("isRead", "==", false),
        orderBy("createdAt", "desc"),
      );

      unsubSnapshot = onSnapshot(q, (snap) => {
        if (isFirstNotify) {
          isFirstNotify = false;
          return;
        }
        snap.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const enabled = await AsyncStorage.getItem("notificationEnabled");
            if (enabled === "false") return;
            const data = change.doc.data();
            Notifications.scheduleNotificationAsync({
              content: {
                title: data.title || "มีการแจ้งเตือน",
                body: data.desc || "",
                data: { postId: data.postId, type: data.type },
              },
              trigger: null,
            });
          }
        });
      });

      // ── Chat listener ✅ ──
      let isFirstChat = true;
      const chatQ = query(
        collection(db, "chats"),
        where("receiverId", "==", user.uid),
        where("isRead", "==", false),
        orderBy("createdAt", "desc"),
      );

      unsubChat = onSnapshot(chatQ, (snap) => {
        if (isFirstChat) {
          isFirstChat = false;
          return;
        }
        snap.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const enabled = await AsyncStorage.getItem("notificationEnabled");
            if (enabled === "false") return;
            const data = change.doc.data();
            const hiddenFor = (data.hiddenFor as string[]) ?? [];
            if (hiddenFor.includes(user.uid)) return; // ✅ ถ้าลบแชทแล้ว ไม่แจ้ง
            Notifications.scheduleNotificationAsync({
              content: {
                title: `${data.senderName || "มีข้อความใหม่"}`,
                body:
                  data.type === "post_card"
                    ? `📌 ${data.title}`
                    : data.text || "มีข้อความใหม่",
                data: { roomId: data.roomId, type: "chat" },
              },
              trigger: null,
            });
          }
        });
      });
    });

    return () => {
      unsubAuth();
      unsubSnapshot?.();
      unsubChat?.(); // ✅ cleanup
    };
  }, []);
}
