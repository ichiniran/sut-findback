import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { useAdminUnread } from "../constants/useAdminUnread";
import AdminChatInbox from "../pages/AdminChatInbox";

export default function AdminInboxFAB({
  onOpenPost,
}: {
  onOpenPost: (postId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const totalUnread = useAdminUnread(); // ← นับ unread ตลอดเวลา ไม่ต้อง render AdminChatInbox ซ้อน

  return (
    <>
      {isOpen && (
        <>
          {/* overlay */}
          <div style={s.overlay} onClick={() => setIsOpen(false)} />
          <div style={s.panel}>
            <div style={s.header}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MessageCircle size={18} color="#5A4633" />
                <h3 style={s.headerTitle}>Admin Inbox</h3>
              </div>
              <button style={s.closeBtn} onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={s.body}>
              <AdminChatInbox
                onOpenPost={(postId) => {
                  setIsOpen(false);
                  onOpenPost(postId);
                }}
                onUnreadChange={() => {}} // ไม่ต้องใช้แล้ว แต่ยังส่ง prop ให้ครบ
              />
            </div>
          </div>
        </>
      )}

      <button style={s.fab} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && totalUnread > 0 && <div style={s.fabBadge} />}
      </button>
    </>
  );
}

// styles เหมือนเดิมทุกอย่างค่ะ
const s: Record<string, React.CSSProperties> = {
  fab: {
    position: "fixed",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: "100%",
    backgroundColor: "#F97316",
    color: "#fff",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 14px rgba(249, 115, 22, 0.4)",
    cursor: "pointer",
    zIndex: 9999,
  },
  fabBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    backgroundColor: "#EF4444",
    borderRadius: "100%",
    border: "2px solid #fff",
  },
  panel: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "min(820px, calc(100vw - 48px))",
    height: "min(620px, calc(100vh - 140px))",
    backgroundColor: "#fff",
    borderRadius: 20,
    boxShadow: "0 10px 40px rgba(90, 70, 51, 0.18)",
    border: "1px solid #f0e6dc",
    display: "flex",
    flexDirection: "column",
    zIndex: 9998,
    overflow: "hidden",
    fontFamily: "'Sarabun', sans-serif",
  },
  header: {
    padding: "14px 18px",
    borderBottom: "1px solid #f0e6dc",
    backgroundColor: "#FFFAF5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
    color: "#5A4633",
  },
  badge: {
    background: "#F97316",
    color: "#fff",
    borderRadius: 20,
    padding: "1px 8px",
    fontSize: 11,
    fontWeight: 700,
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#a0856a",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: 9997,
  },
};
