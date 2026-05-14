import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  ExternalLink,
  Image as ImageIcon,
  MessageCircle,
  Send,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ADMIN_NAME, ADMIN_UID } from "../constants/admin";
import { db } from "../firebase";

interface Message {
  id: string;
  roomId: string;
  senderId?: string;
  receiverId?: string;
  senderName?: string;
  receiverName?: string;
  text?: string;
  type?: string;
  imageUrl?: string;
  postId?: string;
  postType?: string;
  title?: string;
  locationName?: string;
  date?: string;
  imageUri?: string;
  currentStatus?: string;
  createdAt?: any;
  isRead?: boolean;
}

interface ChatRoom {
  roomId: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: Message;
  postCard?: Message;
  unreadCount: number;
}

export default function AdminChatInbox({
  onOpenPost,
  onUnreadChange, // รับ prop จากตัวแม่
}: {
  onOpenPost: (postId: string) => void;
  onUnreadChange?: (count: number) => void; // เพิ่ม Type สำหรับ prop ใหม่
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", ADMIN_UID),
    );

    return onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Message,
        );

        data.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? 0;
          const bTime = b.createdAt?.toMillis?.() ?? 0;
          return aTime - bTime;
        });

        setMessages(data);
      },
      (err) => {
        console.error("admin inbox error:", err);
      },
    );
  }, []);

  const rooms = useMemo(() => {
    const map = new Map<string, ChatRoom>();

    for (const msg of messages) {
      if (!msg.roomId) continue;

      const otherUserId =
        msg.senderId === ADMIN_UID
          ? (msg.receiverId ?? "")
          : (msg.senderId ?? "");

      const otherUserName =
        msg.senderId === ADMIN_UID
          ? msg.receiverName || "User"
          : msg.senderName || "User";

      const current = map.get(msg.roomId);
      const isUnread = msg.senderId !== ADMIN_UID && msg.isRead === false;

      map.set(msg.roomId, {
        roomId: msg.roomId,
        otherUserId,
        otherUserName,
        lastMessage: msg,
        postCard: msg.type === "post_card" ? msg : current?.postCard,
        unreadCount: (current?.unreadCount || 0) + (isUnread ? 1 : 0),
      });
    }

    return Array.from(map.values()).sort((a, b) => {
      const aTime = a.lastMessage.createdAt?.toMillis?.() ?? 0;
      const bTime = b.lastMessage.createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
  }, [messages]);

  const totalUnread = rooms.reduce((sum, room) => sum + room.unreadCount, 0);

  // ส่งค่า totalUnread กลับไปให้แม่ (AdminInboxFAB) ทุกครั้งที่ค่าเปลี่ยน
  useEffect(() => {
    if (onUnreadChange) {
      onUnreadChange(totalUnread);
    }
  }, [totalUnread, onUnreadChange]);

  useEffect(() => {
    if (!selectedRoomId && rooms.length > 0) {
      setSelectedRoomId(rooms[0].roomId);
    }
  }, [rooms, selectedRoomId]);

  useEffect(() => {
    if (!selectedRoomId) return;

    const unreadMessages = messages.filter(
      (m) =>
        m.roomId === selectedRoomId &&
        m.senderId !== ADMIN_UID &&
        m.isRead === false,
    );

    unreadMessages.forEach(async (msg) => {
      try {
        await updateDoc(doc(db, "chats", msg.id), { isRead: true });
      } catch (err) {
        console.error("Failed to mark message as read:", err);
      }
    });
  }, [selectedRoomId, messages]);

  const selectedRoom =
    rooms.find((room) => room.roomId === selectedRoomId) ?? null;

  const selectedMessages = messages.filter(
    (msg) => msg.roomId === selectedRoomId,
  );

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  }, [selectedMessages.length]);

  const sendReply = async () => {
    const text = input.trim();

    if ((!text && !pendingFile) || !selectedRoom || sending) return;

    setSending(true);

    try {
      // ส่งรูปก่อน
      if (pendingFile) {
        const imageUrl = await uploadToCloudinary(pendingFile);

        await addDoc(collection(db, "chats"), {
          roomId: selectedRoom.roomId,
          senderId: ADMIN_UID,
          receiverId: selectedRoom.otherUserId,

          type: "image",
          imageUrl,

          isRead: false,
          createdAt: serverTimestamp(),

          participants: [ADMIN_UID, selectedRoom.otherUserId],

          senderName: ADMIN_NAME,
          receiverName: selectedRoom.otherUserName,

          hiddenFor: [],
        });

        setPendingFile(null);
        setPendingImage(null);
      }

      // ส่งข้อความ
      if (text) {
        await addDoc(collection(db, "chats"), {
          roomId: selectedRoom.roomId,
          senderId: ADMIN_UID,
          receiverId: selectedRoom.otherUserId,

          text,
          type: "text",

          isRead: false,
          createdAt: serverTimestamp(),

          participants: [ADMIN_UID, selectedRoom.otherUserId],

          senderName: ADMIN_NAME,
          receiverName: selectedRoom.otherUserName,

          hiddenFor: [],
        });
      }

      setInput("");
    } finally {
      setSending(false);
    }
  };
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", "nxbvgcct");
    formData.append("cloud_name", "dto2v8z6t");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dto2v8z6t/image/upload",
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await res.json();

    if (!data.secure_url) {
      throw new Error("Upload failed");
    }

    return data.secure_url;
  };
  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setPendingFile(file);
    setPendingImage(URL.createObjectURL(file));

    e.target.value = "";
  };
  return (
    <div style={inbox.wrap}>
      <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: #e8d5c4;
          border-radius: 10px;
        }

        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #c8a882;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <div style={inbox.list} className="custom-scroll">
        {rooms.length === 0 ? (
          <div style={inbox.empty}>ยังไม่มีข้อความ</div>
        ) : (
          rooms.map((room) => {
            const hasUnread = room.unreadCount > 0;
            return (
              <button
                key={room.roomId}
                style={{
                  ...inbox.chatRow,
                  background:
                    selectedRoomId === room.roomId
                      ? "#ffecdc"
                      : hasUnread
                        ? "#FFF3E0"
                        : "#fff",
                  borderLeft:
                    selectedRoomId === room.roomId
                      ? "3px solid transparent"
                      : hasUnread
                        ? "3px solid transparent"
                        : "3px solid transparent",
                }}
                onClick={() => setSelectedRoomId(room.roomId)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      ...inbox.chatUser,
                      color: hasUnread ? "#F97316" : "#3d2b1f",
                      fontWeight: hasUnread ? 800 : 700,
                    }}
                  >
                    @{room.otherUserName}
                  </div>

                  <div
                    style={{
                      ...inbox.lastMsg,
                      color: hasUnread ? "#3d2b1f" : "#a0856a",
                      fontWeight: hasUnread ? 700 : 400,
                    }}
                  >
                    {previewText(room.lastMessage)}
                  </div>
                </div>

                {hasUnread && (
                  <div style={inbox.roomBadge}>{room.unreadCount}</div>
                )}
              </button>
            );
          })
        )}
      </div>

      <div style={inbox.chatPane}>
        {!selectedRoom ? (
          <div style={inbox.noChat}>
            <MessageCircle size={40} color="#e8d5c4" />
            <p style={{ color: "#c8a882", marginTop: 12 }}>
              เลือก chat เพื่อดูข้อความ
            </p>
          </div>
        ) : (
          <>
            {/*<div style={inbox.chatHeader}>
              <div style={{ flex: 1 }}>
                <div style={inbox.chatHeaderName}>
                  @{selectedRoom.otherUserName}
                </div>
              </div>
            </div>*/}

            <div style={inbox.messages} className="custom-scroll">
              {selectedMessages.map((msg) => {
                const isAdmin = msg.senderId === ADMIN_UID;

                if (msg.type === "post_card") {
                  return (
                    <div
                      key={msg.id}
                      style={{ display: "flex", marginBottom: 10 }}
                    >
                      <PostCardWeb
                        msg={msg}
                        onOpen={() => {
                          if (msg.postId) onOpenPost(msg.postId);
                        }}
                      />
                    </div>
                  );
                }

                if (msg.type === "image") {
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        justifyContent: isAdmin ? "flex-end" : "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      {msg.imageUrl ? (
                        <img
                          src={msg.imageUrl}
                          style={inbox.chatImage}
                          alt="chat"
                          onClick={() => setPreviewImage(msg.imageUrl!)}
                        />
                      ) : (
                        <div style={inbox.imageFallback}>
                          <ImageIcon size={18} />
                          รูปภาพ
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent: isAdmin ? "flex-end" : "flex-start",
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        ...inbox.bubble,
                        background: isAdmin ? "#F97316" : "#f5ede6",
                        color: isAdmin ? "#fff" : "#3d2b1f",
                        borderRadius: isAdmin
                          ? "18px 18px 4px 18px"
                          : "18px 18px 18px 4px",
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              <div ref={bottomRef} />
            </div>
            {pendingImage && (
              <div style={inbox.previewBar}>
                <div style={inbox.previewWrap}>
                  <img src={pendingImage} style={inbox.previewImage} alt="" />

                  <button
                    style={inbox.previewRemove}
                    onClick={() => {
                      setPendingImage(null);
                      setPendingFile(null);
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
            <div style={inbox.inputRow}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePickImage}
              />

              <button
                style={inbox.imageBtn}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon size={18} />
              </button>

              <input
                style={inbox.input}
                placeholder="พิมพ์ข้อความตอบกลับ..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendReply();
                }}
              />

              <button
                style={{
                  ...inbox.sendBtn,
                  opacity: sending ? 0.7 : 1,
                  cursor: sending ? "not-allowed" : "pointer",
                }}
                onClick={sendReply}
                disabled={sending || (!input.trim() && !pendingFile)}
              >
                {sending ? <div style={inbox.loader} /> : <Send size={15} />}
              </button>
            </div>
          </>
        )}
      </div>
      {previewImage && (
        <div style={inbox.previewOverlay} onClick={() => setPreviewImage(null)}>
          <img
            src={previewImage}
            style={inbox.previewImg}
            alt="preview"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function previewText(msg: Message) {
  if (msg.type === "post_card") return "ส่งโพสต์มาให้ตรวจสอบ";
  if (msg.type === "image") return "ส่งรูปภาพ";
  return msg.text || "-";
}

function PostCardWeb({ msg, onOpen }: { msg: Message; onOpen: () => void }) {
  const isFound = msg.postType === "found";

  return (
    <button style={card.wrap} onClick={onOpen}>
      <div
        style={{
          ...card.strip,
          background: isFound ? "#fff7ed" : "#fef2f2",
        }}
      >
        <span
          style={{
            color: isFound ? "#F97316" : "#ef4444",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {isFound ? "โพสต์พบของ" : "โพสต์ของหาย"}
        </span>

        <span style={{ margin: "0 6px", color: "#d4b89a" }}>·</span>

        <span
          style={{
            color: msg.currentStatus === "claimed" ? "#16a34a" : "#F97316",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {msg.currentStatus === "claimed" ? "มีคนรับแล้ว" : "รอดำเนินการ"}
        </span>
      </div>

      <div style={card.body}>
        {msg.imageUri ? (
          <img src={msg.imageUri} style={card.thumb} alt="" />
        ) : (
          <div style={card.thumbEmpty}>
            <User size={22} />
          </div>
        )}

        <div style={card.info}>
          <div style={card.title}>{msg.title || "-"}</div>
          {msg.locationName && <div style={card.meta}>{msg.locationName}</div>}
          {msg.date && <div style={card.meta}>{msg.date}</div>}
          <div style={card.postId}>#{msg.postId?.slice(0, 8)}</div>
        </div>
      </div>

      <div style={card.openBtn}>
        <ExternalLink size={12} />
        เปิดใน Post Management
      </div>
    </button>
  );
}

const inbox: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    height: "100%",
    minHeight: 500,
    overflow: "hidden",
    background: "#fff",
    fontFamily: "'Noto Sans Thai', sans-serif",
  },
  list: {
    width: 200,
    borderRight: "1px solid #f0e6dc",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    background: "#fffaf7",
  },
  // ลบ inbox.listHeader ลบ inbox.badge ตรงนี้ออกไป เพราะย้ายไป s.badge ที่ตัวแม่แทนแล้ว
  roomBadge: {
    background: "#F97316",
    color: "#fff",
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    fontSize: 11,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 6px",
    marginLeft: 6,
    flexShrink: 0,
  },
  chatRow: {
    display: "flex",
    gap: 10,
    padding: "12px 14px",
    cursor: "pointer",
    border: "none",
    borderBottom: "1px solid #fdf0e8",
    textAlign: "left",
    alignItems: "flex-start",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    background: "#f8e8dc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    color: "#6E4D31",
    fontSize: 13,
    flexShrink: 0,
  },
  chatUser: {
    fontSize: 13,
    marginBottom: 4,
  },
  miniCard: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#fff7f0",
    borderRadius: 8,
    padding: "4px 8px",
    marginBottom: 4,
  },
  miniThumb: {
    width: 24,
    height: 24,
    borderRadius: 4,
    objectFit: "cover",
  },
  miniTitle: {
    fontSize: 11,
    color: "#5A4633",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontFamily: "'Noto Sans Thai', sans-serif",
  },
  lastMsg: {
    fontSize: 11,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontFamily: "'Noto Sans Thai', sans-serif",
  },
  empty: {
    padding: 24,
    textAlign: "center",
    color: "#c8a882",
    fontSize: 13,
    fontFamily: "'Noto Sans Thai', sans-serif",
  },
  chatPane: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  noChat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  chatHeader: {
    padding: "10px 18px",
    borderBottom: "1px solid #f0e6dc",
    display: "flex",
    alignItems: "center",
    background: "#fffaf7",
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    border: "1px solid #e8d5c4",
    background: "#fff",
    color: "#a0856a",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  chatHeaderName: {
    fontSize: 15,
    fontWeight: 800,
    color: "#3d2b1f",
  },
  chatHeaderSub: {
    fontSize: 12,
    color: "#a0856a",
    marginTop: 2,
  },
  openPostBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "7px 12px",
    borderRadius: 10,
    border: "1px solid #F97316",
    background: "#fff7f0",
    color: "#F97316",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
  },
  bubble: {
    maxWidth: 300,
    padding: "10px 14px",
    fontSize: 14,
    lineHeight: 1.5,
  },
  chatImage: {
    width: 220,
    height: 220,
    objectFit: "cover",
    borderRadius: 14,
  },
  imageFallback: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "12px 14px",
    borderRadius: 14,
    background: "#f5ede6",
    color: "#3d2b1f",
  },
  inputRow: {
    display: "flex",
    gap: 8,
    padding: "12px 16px",
    borderTop: "1px solid #f0e6dc",
    background: "#fff",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #e8d5c4",
    fontSize: 12,
    fontFamily: "'Noto Sans Thai', sans-serif",
    outline: "none",
    background: "#fffcfa",
    color: "#3d2b1f",
  },
  sendBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 18px",
    borderRadius: 12,
    border: "none",
    background: "#F97316",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "'Noto Sans Thai', sans-serif",
  },
  previewOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    cursor: "pointer",
  },
  previewImg: {
    maxWidth: "70vw",
    maxHeight: "70vh",
    borderRadius: 12,
    objectFit: "contain",
    cursor: "default",
  },
  imageBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: "1px solid #e8d5c4",
    background: "#fff7f0",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    color: "#F97316",
    cursor: "pointer",

    flexShrink: 0,
  },
  previewBar: {
    padding: "10px 14px 0",
    background: "#fff",
  },

  previewWrap: {
    position: "relative",
    width: 90,
    height: 90,
    marginBottom: 10,
  },

  previewImage: {
    width: 90,
    height: 90,
    objectFit: "cover",
    borderRadius: 14,
    border: "1px solid #f0e6dc",
  },

  previewRemove: {
    position: "absolute",
    top: -6,
    right: -6,

    width: 24,
    height: 24,

    borderRadius: "100%",
    border: "none",

    background: "rgba(0,0,0,0.65)",
    color: "#fff",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    cursor: "pointer",
  },
  loader: {
    width: 16,
    height: 16,

    border: "2px solid rgba(255,255,255,0.35)",
    borderTop: "2px solid #fff",

    borderRadius: "100%",

    animation: "spin 0.8s linear infinite",
  },
};

const card: Record<string, React.CSSProperties> = {
  wrap: {
    width: 280,
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid #f0e6dc",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(90,70,51,0.08)",
    cursor: "pointer",
    padding: 0,
    textAlign: "left",
    fontFamily: "'Noto Sans Thai', sans-serif",
  },
  strip: {
    display: "flex",
    alignItems: "center",
    padding: "6px 12px",
  },
  body: {
    display: "flex",
    gap: 10,
    padding: 10,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    objectFit: "cover",
    border: "1px solid #f0e6dc",
  },
  thumbEmpty: {
    width: 64,
    height: 64,
    borderRadius: 10,
    background: "#fdf0e8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#a0856a",
  },
  info: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    color: "#3d2b1f",
    fontFamily: "'Noto Sans Thai', sans-serif",
    lineHeight: "1.4",
  },
  meta: {
    fontSize: 11,
    color: "#a0856a",
    fontFamily: "'Noto Sans Thai', sans-serif",
  },
  postId: {
    fontSize: 10,
    color: "#c8a882",
    fontFamily: "'Noto Sans Thai', sans-serif",
  },
  openBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    width: "100%",
    padding: "8px 0",
    borderTop: "1px solid #f0e6dc",
    background: "#fffaf7",
    color: "#F97316",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "'Noto Sans Thai', sans-serif",
  },
};
