import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ADMIN_UID } from "../constants/admin";
import { db } from "../firebase";

export function useAdminUnread() {
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", ADMIN_UID),
    );

    return onSnapshot(q, (snap) => {
      const unread = snap.docs.filter((d) => {
        const data = d.data();
        return data.senderId !== ADMIN_UID && data.isRead === false;
      }).length;

      setTotalUnread(unread);
    });
  }, []);

  return totalUnread;
}
