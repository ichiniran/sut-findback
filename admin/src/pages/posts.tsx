import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { Eye, FileText, Map, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "../firebase";

// ── Types ──────────────────────────────────────────────────────────────────
interface Post {
  id: string;
  type: "found" | "lost";
  category?: string;
  detail?: string;
  images?: string[];
  location?: string;
  locationName?: string;
  locationDetail?: string;
  receiveLocationImage?: string;
  latitude?: number;
  longitude?: number;
  date?: string;
  status?: "waiting" | "claimed" | "rejected";
  userId?: string;
  username?: string;
  postId?: string;
  receiveLocation?: string;
  createdAt?: Timestamp | string | null;
  updatedAt?: Timestamp | string | null;
}

interface UserInfo {
  username?: string;
  email?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "waiting", label: "รอดำเนินการ" },
  { key: "claimed", label: "มีคนรับแล้ว" },
  { key: "rejected", label: "ลบออก (report)" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "ทุกประเภท" },
  { value: "found", label: "พบของ" },
  { value: "lost", label: "ของหาย" },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; color: string; border: string }
> = {
  waiting: { label: "รอดำเนินการ", bg: "#fff3e0", color: "#e65100", border: "#ffcc80" },
  claimed: { label: "มีคนรับแล้ว", bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
  rejected: { label: "ลบออก (report)", bg: "#ffebee", color: "#c62828", border: "#ef9a9a" },
};

// ── Helpers ────────────────────────────────────────────────────────────────
const toDateStr = (val: Timestamp | string | null | undefined): string => {
  if (!val) return "-";
  if (typeof val === "string") return val.slice(0, 10);
  if (typeof (val as any).toDate === "function")
    return (val as Timestamp).toDate().toLocaleDateString("th-TH", { dateStyle: "medium" });
  return "-";
};

const toDateInput = (val: Timestamp | string | null | undefined): string => {
  if (!val) return "";
  if (typeof val === "string") return val.slice(0, 10);
  if (typeof (val as any).toDate === "function")
    return (val as Timestamp).toDate().toISOString().slice(0, 10);
  return "";
};

const toDate = (val: Timestamp | string | null | undefined): Date => {
  if (!val) return new Date(0);
  if (val instanceof Timestamp) return val.toDate();
  return new Date(val);
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function PostManagementPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  // detail modal
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<UserInfo | null>(null);
  const [postLoading, setPostLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // confirm delete
  const [confirmDelete, setConfirmDelete] = useState<Post | null>(null);

  // ── Firestore listener ──
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "posts"),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
        data.sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
        setPosts(data);
        setLoading(false);
      },
      (err) => {
        console.error("posts:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Open detail modal ──
  const openDetail = async (post: Post) => {
    setSelectedPost(post);
    setOwnerInfo(null);
    setPostLoading(true);
    try {
      if (post.userId) {
        const snap = await getDoc(doc(db, "users", post.userId));
        if (snap.exists()) setOwnerInfo(snap.data() as UserInfo);
      }
    } catch (e) {
      console.error(e);
    }
    setPostLoading(false);
  };

  const closeDetail = () => {
    setSelectedPost(null);
    setOwnerInfo(null);
  };

  // ── Toast ──
  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Change status ──
  const handleChangeStatus = async (postId: string, newStatus: "waiting" | "claimed" | "rejected") => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "posts", postId), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
      showToast(`เปลี่ยนสถานะเป็น "${STATUS_CONFIG[newStatus].label}" แล้ว`, "success");
      closeDetail();
    } catch {
      showToast("เกิดข้อผิดพลาด กรุณาลองใหม่", "error");
    }
    setActionLoading(false);
  };

  // ── Delete post ──
  const handleDelete = async (post: Post) => {
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "posts", post.id));
      showToast("ลบโพสต์เรียบร้อยแล้ว", "success");
      setConfirmDelete(null);
      closeDetail();
    } catch {
      showToast("เกิดข้อผิดพลาด กรุณาลองใหม่", "error");
    }
    setActionLoading(false);
  };

  // ── Filter ──
  const filtered = posts.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    const d = toDateInput(p.createdAt);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = [p.category, p.detail, p.locationName, p.username, p.id].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // ── Stats ──
  const stats = {
    all: posts.length,
    waiting: posts.filter((p) => p.status === "waiting").length,
    claimed: posts.filter((p) => p.status === "claimed").length,
    rejected: posts.filter((p) => p.status === "rejected").length,
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <style>{`
        .pm-modal::-webkit-scrollbar { width: 6px; }
        .pm-modal::-webkit-scrollbar-track { background: transparent; margin: 24px 0; }
        .pm-modal::-webkit-scrollbar-thumb { background: #e8d5c4; border-radius: 99px; }
        .pm-modal::-webkit-scrollbar-thumb:hover { background: #d4b89a; }
        .pm-row:hover { background: #fff7f2 !important; }
        .pm-detail-btn:hover { background: #F97316 !important; color: #fff !important; }
        .pm-status-btn:hover { opacity: 0.8; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ ...s.toast, background: toast.type === "success" ? "#22c55e" : "#ef4444" }}>
          {toast.type === "success" ? "SUCCESS" : "ERROR"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <h1 style={{ ...s.title, display: "flex", alignItems: "center", gap: 10 }}>
                      <FileText size={24} />Post Management
                  </h1>
                  <p style={s.subtitle}>จัดการโพสต์ทั้งหมดในระบบ</p>
                </div>
        <div style={s.statsRow}>
          {(["waiting", "claimed", "rejected"] as const).map((k) => (
            <div style={{...s.statCard, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#a0856a", fontWeight: 600 }}>
              {STATUS_CONFIG[k].label}
            </span>

            <span style={{ fontSize: 14, fontWeight: 800, color: STATUS_CONFIG[k].color }}>
              {stats[k]}
            </span>

            <span style={{ fontSize: 12, color: "#a0856a" }}>
              โพสต์
            </span>
          </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={s.filterBox}>
        <div style={s.tabs}>
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              style={{ ...s.tab, ...(statusFilter === t.key ? s.tabActive : {}) }}
              onClick={() => setStatusFilter(t.key)}
            >
              {t.label}
              
            </button>
          ))}
        </div>

        <div style={s.filterRight}>
          <div style={s.searchBox}>
            <Search size={14} style={s.searchIcon} />
            <input
              style={s.searchInput}
              placeholder="ค้นหา หมวดหมู่, สถานที่"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select style={s.select} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input type="date" style={s.dateInput} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span style={{ color: "#a0856a", fontSize: 13 }}>–</span>
          <input type="date" style={s.dateInput} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          {(statusFilter !== "all" || typeFilter !== "all" || dateFrom || dateTo || search) && (
            <button
              style={s.clearBtn}
              onClick={() => { setStatusFilter("all"); setTypeFilter("all"); setDateFrom(""); setDateTo(""); setSearch(""); }}
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        {loading ? (
          <div style={s.empty}>กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>ไม่พบโพสต์ที่ตรงกับเงื่อนไข</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {["ประเภท", "หมวดหมู่", "สถานที่", "เจ้าของ", "วันที่", "สถานะ", "จัดการ"].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const st = STATUS_CONFIG[p.status ?? "waiting"] ?? STATUS_CONFIG.waiting;
                return (
                  <tr key={p.id} className="pm-row" style={s.tr}>
                    <td style={s.td}>
                      <span style={{
                        ...s.typeBadge,
                        background: p.type === "found" ? "#e8f5e9" : "#fff3e0",
                        color: p.type === "found" ? "#2e7d32" : "#e65100",
                        border: `1px solid ${p.type === "found" ? "#a5d6a7" : "#ffcc80"}`,
                      }}>
                        {p.type === "found" ? "พบของ" : "ของหาย"}
                      </span>
                    </td>
                    <td style={s.td}>{p.category ?? "-"}</td>
                    <td style={{ ...s.td, maxWidth: 180 }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.location ?? "-"}
                      </span>
                    </td>
                    <td style={s.td}>{p.username ? `@${p.username}` : "-"}</td>
                    <td style={s.td}>{toDateStr(p.createdAt)}</td>
                    <td style={s.td}>
                      <span style={{ ...s.statusBadge, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="pm-detail-btn"
                          style={s.detailBtn}
                          onClick={() => openDetail(p)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          style={s.deleteBtn}
                          onClick={() => setConfirmDelete(p)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selectedPost && (
        <div style={s.overlay} onClick={closeDetail}>
          <div style={s.modal} className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal" style={{ overflowY: "auto", padding: "28px 30px", flex: 1, scrollbarWidth: "thin", scrollbarColor: "#e8d5c4 transparent" }}>
              <div style={s.modalHeader}>
                <h2 style={s.modalTitle}>รายละเอียดโพสต์</h2>
                <button style={s.closeBtn} onClick={closeDetail}>✕</button>
              </div>

              {/* Type + Status badges */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <span style={{
                  ...s.typeBadge,
                  background: selectedPost.type === "found" ? "#e8f5e9" : "#fff3e0",
                  color: selectedPost.type === "found" ? "#2e7d32" : "#e65100",
                  border: `1px solid ${selectedPost.type === "found" ? "#a5d6a7" : "#ffcc80"}`,
                }}>
                  {selectedPost.type === "found" ? "พบของ" : "ของหาย"}
                </span>
                {selectedPost.status && STATUS_CONFIG[selectedPost.status] && (
                  <span style={{
                    ...s.typeBadge,
                    background: STATUS_CONFIG[selectedPost.status].bg,
                    color: STATUS_CONFIG[selectedPost.status].color,
                    border: `1px solid ${STATUS_CONFIG[selectedPost.status].border}`,
                  }}>
                    {STATUS_CONFIG[selectedPost.status].label}
                  </span>
                )}
              </div>

              {/* Images */}
              {selectedPost.images && selectedPost.images.length > 0 && (
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {selectedPost.images.slice(0, 4).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`img-${i}`}
                      onClick={() => setPreviewImage(url)}
                      style={{ width: 90, height: 90, borderRadius: 10, objectFit: "cover", border: "1px solid #f0e6dc", cursor: "pointer" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ))}
                </div>
              )}

              {/* Post Info */}
              <div style={s.section}>
                <p style={s.sectionTitle}>ข้อมูลโพสต์</p>
                <InfoRow label="Post ID" value={selectedPost.id} mono />
                <InfoRow label="เจ้าของโพสต์" value={
                  postLoading ? "กำลังโหลด..." :
                  ownerInfo?.username ? `@${ownerInfo.username}` :
                  ownerInfo?.email ?? selectedPost.username ?? "-"
                } />
                <InfoRow label="หมวดหมู่" value={selectedPost.category ?? "-"} />
                <InfoRow label="รายละเอียด" value={selectedPost.detail ?? "-"} />
                <InfoRow label="วันที่" value={selectedPost.date ?? toDateStr(selectedPost.createdAt)} />
                <InfoRow label="สถานที่" value={selectedPost.locationName ?? selectedPost.location ?? "-"} />
                {selectedPost.locationDetail && <InfoRow label="รายละเอียดสถานที่" value={selectedPost.locationDetail} />}
                {selectedPost.latitude && selectedPost.longitude && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#a0856a", fontWeight: 700, minWidth: 110, textAlign: "left",}}>พิกัดสถานที่</span>
                    <a
                      href={`https://www.google.com/maps?q=${encodeURIComponent(selectedPost.location?? "-")}&ll=${selectedPost.latitude},${selectedPost.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#F97316", fontWeight: 700, textDecoration: "none", background: "#fff7f0", border: "1px solid #f0e6dc", borderRadius: 8, padding: "3px 8px" }}
                    >
                      <Map size={13} style={{ marginRight: 2 }} />
                      เปิด Google Maps
                    </a>
                  </div>
                )}
                <InfoRow label="สถานที่รับคืน" value={selectedPost.receiveLocation ?? "-"} />
                {selectedPost.receiveLocationImage && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 12, color: "#a0856a", fontWeight: 700, minWidth: 110 }}>รูปจุดรับคืน</span>
                    <img
                      src={selectedPost.receiveLocationImage}
                      onClick={() => setPreviewImage(selectedPost.receiveLocationImage!)}
                      alt="receive"
                      style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover", border: "1px solid #f0e6dc", cursor: "pointer" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
                <InfoRow label="สร้างเมื่อ" value={toDateStr(selectedPost.createdAt)} />
              </div>

              {/* Change Status */}
              <div style={s.section}>
                <p style={s.sectionTitle}>เปลี่ยนสถานะ</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(["waiting", "claimed", "rejected"] as const).map((st) => (
                    <button
                      key={st}
                      className="pm-status-btn"
                      disabled={actionLoading || selectedPost.status === st}
                      onClick={() => handleChangeStatus(selectedPost.id, st)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 12,
                        border: `1px solid ${STATUS_CONFIG[st].border}`,
                        background: selectedPost.status === st ? STATUS_CONFIG[st].bg : "#fff",
                        color: STATUS_CONFIG[st].color,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: selectedPost.status === st ? "default" : "pointer",
                        fontFamily: "'Sarabun', sans-serif",
                        opacity: selectedPost.status === st ? 1 : 0.85,
                        boxShadow: selectedPost.status === st ? `0 0 0 2px ${STATUS_CONFIG[st].border}` : "none",
                      }}
                    >
                      {STATUS_CONFIG[st].label}
                      {selectedPost.status === st }
                    </button>
                  ))}
                </div>
              </div>

              {/* Delete */}
              <button
                style={s.fullDeleteBtn}
                onClick={() => setConfirmDelete(selectedPost)}
                disabled={actionLoading}
              >
                <Trash2 size={14} style={{ marginRight: 6 }} />
                ลบโพสต์นี้ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      {confirmDelete && (
        <div style={s.overlay} onClick={() => setConfirmDelete(null)}>
          <div style={{ ...s.modal, maxWidth: 420, padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>DELETE</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#5A4633", margin: "0 0 8px" }}>ยืนยันการลบโพสต์</h3>
              <p style={{ fontSize: 13, color: "#a0856a", margin: 0 }}>
                โพสต์นี้จะถูกลบออกจากระบบถาวร ไม่สามารถกู้คืนได้
              </p>
              {confirmDelete.detail && (
                <div style={{ margin: "16px 0 0", background: "#fff7f0", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#5A4633", border: "1px solid #f0e6dc" }}>
                  "{confirmDelete.detail}"
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={{ flex: 1, padding: "12px 0", borderRadius: 14, border: "1px solid #e8d5c4", background: "#fff", color: "#a0856a", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Sarabun', sans-serif" }}
                onClick={() => setConfirmDelete(null)}
              >
                ยกเลิก
              </button>
              <button
                style={{ flex: 1, padding: "12px 0", borderRadius: 14, border: "none", background: "#ef4444", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Sarabun', sans-serif" }}
                onClick={() => handleDelete(confirmDelete)}
                disabled={actionLoading}
              >
                {actionLoading ? "กำลังลบ..." : "ลบโพสต์"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image preview */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}
        >
          <img src={previewImage} style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 16, objectFit: "contain" }} alt="preview" />
        </div>
      )}
    </div>
  );
}

// ── InfoRow ────────────────────────────────────────────────────────────────
function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
      <span style={{ fontSize: 12, color: "#a0856a", fontWeight: 700, minWidth: 110, textAlign: "left" }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: "#5A4633", fontFamily: mono ? "monospace" : "inherit", wordBreak: "break-all" }}>
        {value}
      </span>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    padding: "32px 36px",
    background: "linear-gradient(160deg, #FFFAF5 0%, #ffe6d0 100%)",
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    fontFamily: "'Sarabun', sans-serif",
  },
   header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },

  title: {
    fontSize: 28,
    fontWeight: 800,
    color: "#5A4633",
    margin: 0,
    letterSpacing: "-0.5px",
    fontFamily: "'Inter', sans-serif",
  },

  subtitle: {
    fontSize: 13,
    color: "#a0856a",
    marginTop: 6,
    marginLeft: 0,
    marginBottom: 0,
  },
  statsRow: { display: "flex", gap: 14, flexWrap: "wrap",  alignItems: "center" },
  statCard: {
    background: "rgba(255,255,255,0.7)",
    border: "1px solid #f0e6dc",
    borderRadius: 20,
    padding: "8px 18px",
    fontSize: 13,
    color: "#a0856a",
    fontWeight: 600,
    backdropFilter: "blur(8px)",
  },
  filterBox: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    background: "rgba(255,255,255,0.7)",
    borderRadius: 16,
    padding: "14px 18px",
    border: "1px solid rgba(255,255,255,0.9)",
    boxShadow: "0 2px 12px rgba(90,70,51,0.06)",
  },
  tabs: { display: "flex", gap: 6 },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    borderRadius: 20,
    border: "1px solid #e8d5c4",
    background: "transparent",
    color: "#a0856a",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Sarabun', sans-serif",
  },
  tabActive: { background: "#F97316", color: "#fff", border: "1px solid #F97316" },
  tabCount: {
    padding: "1px 7px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
  },
  filterRight: { display: "flex", alignItems: "center", gap: 10, marginLeft: "auto", flexWrap: "wrap" },
  searchBox: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    color: "#a0856a",
  },
  searchInput: {
    padding: "7px 12px 7px 34px",
    borderRadius: 10,
    border: "1px solid #e8d5c4",
    background: "#fff",
    color: "#5A4633",
    fontSize: 13,
    fontFamily: "'Sarabun', sans-serif",
    width: 220,
  },
  select: {
    padding: "7px 12px",
    borderRadius: 10,
    border: "1px solid #e8d5c4",
    background: "#fff",
    color: "#5A4633",
    fontSize: 13,
    fontFamily: "'Sarabun', sans-serif",
    cursor: "pointer",
  },
  dateInput: {
    padding: "7px 10px",
    borderRadius: 10,
    border: "1px solid #e8d5c4",
    background: "#fff",
    color: "#5A4633",
    fontSize: 13,
    fontFamily: "'Sarabun', sans-serif",
  },
  clearBtn: {
    padding: "7px 14px",
    borderRadius: 10,
    border: "1px solid #FBAA58",
    background: "transparent",
    color: "#F97316",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Sarabun', sans-serif",
  },
  tableWrap: {
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(12px)",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.9)",
    boxShadow: "0 2px 12px rgba(90,70,51,0.08)",
    overflow: "hidden",
    flex: 1,
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    padding: "13px 16px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 700,
    color: "#a0856a",
    textTransform: "uppercase",
    letterSpacing: "0.7px",
    background: "#fff9f5",
    borderBottom: "1px solid #f0e6dc",
  },
  tr: { borderBottom: "1px solid #fdf0e8", transition: "background 0.15s" },
  td: { padding: "12px 16px", color: "#5A4633", verticalAlign: "middle", textAlign: "left" },
  typeBadge: { padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" },
  statusBadge: { padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" },
  detailBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    padding: 0,
    borderRadius: 12,
    border: "1px solid #F97316",
    background: "transparent",
    color: "#F97316",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  deleteBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    padding: 0,
    borderRadius: 12,
    border: "1px solid #ef9a9a",
    background: "#fff5f5",
    color: "#c62828",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  empty: { padding: "60px 20px", textAlign: "center", color: "#c8a882", fontSize: 14 },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(90,70,51,0.35)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
  },
  modal: {
    background: "#FFFAF5",
    borderRadius: 24,
    width: "100%",
    maxWidth: 620,
    maxHeight: "88vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 60px rgba(90,70,51,0.22)",
    fontFamily: "'Sarabun', sans-serif",
  },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 800, color: "#5A4633", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: 18, color: "#a0856a", cursor: "pointer", padding: "4px 8px" },
  section: {
    background: "rgba(255,255,255,0.8)",
    borderRadius: 16,
    padding: "16px 18px",
    marginBottom: 14,
    border: "1px solid #f0e6dc",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#a0856a",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: 12,
    marginTop: 0,
  },
  fullDeleteBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "12px 0",
    borderRadius: 14,
    border: "1px solid #ef9a9a",
    background: "#ffebee",
    color: "#c62828",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Sarabun', sans-serif",
    marginTop: 4,
  },
  toast: {
    position: "fixed",
    bottom: 28,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "12px 24px",
    borderRadius: 14,
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    zIndex: 2000,
    boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
    fontFamily: "'Sarabun', sans-serif",
    whiteSpace: "nowrap",
  },
};