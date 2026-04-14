import { db } from "@/admin/src/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export async function submitReport({
  postId,
  reportedBy,
  reason,
}: {
  postId: string;
  reportedBy: string;
  reason: string;
}) {
  await addDoc(collection(db, "reports"), {
    postId,
    reportedBy,
    reason,
    status: "pending",
    createdAt: serverTimestamp(),
    reviewedAt: null,
    notified: false,
  });
}