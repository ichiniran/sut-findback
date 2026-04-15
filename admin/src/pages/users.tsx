
import {
    collection,
    doc,
    onSnapshot,
    Timestamp,
    updateDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";

// ── Types ──────────────────────────────────────────────────────────────────
interface UserDoc {
  id: string;
  username?: string;
  email?: string;
  createdAt?: Timestamp | string | null;
  banned?: boolean;
}

interface PostDoc {
  id: string;
  userId?: string;
}

interface ReportDoc {
  id: string;
  postId?: string;
  status?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const toDateStr = (val: Timestamp | string | null | undefined): string => {
  if (!val) return "-";
  if (typeof val === "string") return val.slice(0, 10);
  if (typeof (val as any).toDate === "function")
    return (val as Timestamp)
      .toDate()
      .toLocaleDateString("th-TH", { dateStyle: "medium" });
  return "-";
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [posts, setPosts] = useState<PostDoc[]>([]);
  const [reports, setReports] = useState<ReportDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [bannedFilter, setBannedFilter] = useState<"all" | "active" | "banned">("all");

  // modal
  const [selectedUser, setSelectedUser] = useState<UserDoc | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmBan, setConfirmBan] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ── Firestore listeners ──
  useEffect(() => {
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserDoc)));
        setLoading(false);
      },
      (err) => { console.error("users:", err); setLoading(false); }
    );

    const unsubPosts = onSnapshot(
      collection(db, "posts"),
      (snap) => setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PostDoc))),
      (err) => console.error("posts:", err)
    );

    const unsubReports = onSnapshot(
      collection(db, "reports"),
      (snap) => setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReportDoc))),
      (err) => console.error("reports:", err)
    );

    return () => { unsubUsers(); unsubPosts(); unsubReports(); };
  }, []);

  // ── คำนวณจำนวน report ที่โพสต์ของแต่ละ user ถูกแจ้ง ──
  const reportCountByUser = useMemo(() => {
    const postsByUser: Record<string, Set<string>> = {};
    posts.forEach((p) => {
      if (p.userId) {
        if (!postsByUser[p.userId]) postsByUser[p.userId] = new Set();
        postsByUser[p.userId].add(p.id);
      }
    });

    const countMap: Record<string, number> = {};
    reports.forEach((r) => {
      if (!r.postId) return;
      for (const [uid, postIds] of Object.entries(postsByUser)) {
        if (postIds.has(r.postId)) {
          countMap[uid] = (countMap[uid] || 0) + 1;
          break;
        }
      }
    });
    return countMap;
  }, [posts, reports]);

  // ── Filter ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users
      .filter((u) => {
        if (bannedFilter === "active" && u.banned) return false;
        if (bannedFilter === "banned" && !u.banned) return false;
        if (q) {
          const inUsername = (u.username ?? "").toLowerCase().includes(q);
          const inEmail = (u.email ?? "").toLowerCase().includes(q);
          if (!inUsername && !inEmail) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // sort by createdAt desc
        const ta = typeof a.createdAt === "string"
          ? a.createdAt
          : (a.createdAt as Timestamp)?.toDate?.()?.toISOString() ?? "";
        const tb = typeof b.createdAt === "string"
          ? b.createdAt
          : (b.createdAt as Timestamp)?.toDate?.()?.toISOString() ?? "";
        return tb.localeCompare(ta);
      });
  }, [users, search, bannedFilter]);

  // ── Toast ──
  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Toggle ban ──
  const handleToggleBan = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    const newBanned = !selectedUser.banned;
    try {
      await updateDoc(doc(db, "users", selectedUser.id), { banned: newBanned });
      showToast(
        newBanned ? `แบน ${selectedUser.username ?? selectedUser.email} แล้ว` : `ปลดแบน ${selectedUser.username ?? selectedUser.email} แล้ว`,
        "success"
      );
      setSelectedUser(null);
      setConfirmBan(false);
    } catch {
      showToast("เกิดข้อผิดพลาด กรุณาลองใหม่", "error");
    }
    setActionLoading(false);
  };

  const reportCount = selectedUser ? (reportCountByUser[selectedUser.id] ?? 0) : 0;
  const userPostCount = selectedUser
    ? posts.filter((p) => p.userId === selectedUser.id).length
    : 0;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>

      {/* Toast */}
      {toast && (
        <div style={{ ...s.toast, background: toast.type === "success" ? "#22c55e" : "#ef4444" }}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>👤 User Management</h1>
          <p style={s.subtitle}>จัดการผู้ใช้งานในระบบ</p>
        </div>
        <div style={s.badge}>
          ทั้งหมด{" "}
          <span style={{ color: "#F97316", fontWeight: 800 }}>{users.length}</span>{" "}
          คน &nbsp;·&nbsp; แบนแล้ว{" "}
          <span style={{ color: "#ef4444", fontWeight: 800 }}>
            {users.filter((u) => u.banned).length}
          </span>{" "}
          คน
        </div>
      </div>

      {/* Filter bar */}
      <div style={s.filterBox}>
        {/* Search */}
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            style={s.searchInput}
            placeholder="ค้นหาด้วย username หรือ email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button style={s.clearX} onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        {/* Status tabs */}
        <div style={s.tabs}>
          {(["all", "active", "banned"] as const).map((k) => (
            <button
              key={k}
              style={{ ...s.tab, ...(bannedFilter === k ? s.tabActive : {}) }}
              onClick={() => setBannedFilter(k)}
            >
              {k === "all" ? "ทั้งหมด" : k === "active" ? "ปกติ" : "ถูกแบน"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        {loading ? (
          <div style={s.empty}>กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {[ "Username", "Email", "วันที่สมัคร", "โพสต์", "ถูก Report", "สถานะ", "จัดการ"].map(
                  (h) => <th key={h} style={s.th}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const rc = reportCountByUser[u.id] ?? 0;
                const pc = posts.filter((p) => p.userId === u.id).length;
                return (
                  <tr key={u.id} style={s.tr}>
                   
                    <td style={s.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 600, color: "#5A4633" }}>
                          {u.username ?? "-"}
                        </span>
                      </div>
                    </td>
                    <td style={{ ...s.td, color: "#a0856a", fontSize: 12 }}>{u.email ?? "-"}</td>
                    <td style={{ ...s.td, fontSize: 12 }}>{toDateStr(u.createdAt)}</td>
                    <td style={s.td}>
                      <span style={s.countBadge}>{pc}</span>
                    </td>
                    <td style={s.td}>
                      <span
                        style={{
                          ...s.countBadge,
                          background: rc > 0 ? "#ffebee" : "#f5f5f5",
                          color: rc > 0 ? "#c62828" : "#a0856a",
                          border: rc > 0 ? "1px solid #ef9a9a" : "1px solid #e0e0e0",
                        }}
                      >
                        {rc > 0 ? `🚩 ${rc}` : rc}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span
                        style={{
                          ...s.statusBadge,
                          background: u.banned ? "#ffebee" : "#e8f5e9",
                          color: u.banned ? "#c62828" : "#2e7d32",
                          border: `1px solid ${u.banned ? "#ef9a9a" : "#a5d6a7"}`,
                        }}
                      >
                        {u.banned ? "ถูกแบน" : "ปกติ"}
                      </span>
                    </td>
                    <td style={s.td}>
                      <button style={s.detailBtn} onClick={() => { setSelectedUser(u); setConfirmBan(false); }}>
                        จัดการ
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal ── */}
      {selectedUser && (
        <div style={s.overlay} onClick={() => { setSelectedUser(null); setConfirmBan(false); }}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>

            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>👤 ข้อมูลผู้ใช้</h2>
              <button style={s.closeBtn} onClick={() => { setSelectedUser(null); setConfirmBan(false); }}>✕</button>
            </div>

            {/* Avatar + name */}
            <div style={s.userHero}>
              <div style={s.avatarLg}>
                {(selectedUser.username ?? selectedUser.email ?? "?")[0].toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 18, color: "#5A4633" }}>
                  {selectedUser.username ?? "-"}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "#a0856a" }}>{selectedUser.email ?? "-"}</p>
                <span
                  style={{
                    ...s.statusBadge,
                    marginTop: 6,
                    display: "inline-block",
                    background: selectedUser.banned ? "#ffebee" : "#e8f5e9",
                    color: selectedUser.banned ? "#c62828" : "#2e7d32",
                    border: `1px solid ${selectedUser.banned ? "#ef9a9a" : "#a5d6a7"}`,
                  }}
                >
                  {selectedUser.banned ? "🚫 ถูกแบน" : "✅ ปกติ"}
                </span>
              </div>
            </div>

            {/* Info */}
            <div style={s.section}>
              <p style={s.sectionTitle}>ข้อมูลบัญชี</p>
              <InfoRow label="User ID" value={selectedUser.id} mono />
              <InfoRow label="Username" value={selectedUser.username ?? "-"} />
              <InfoRow label="Email" value={selectedUser.email ?? "-"} />
              <InfoRow label="วันที่สมัคร" value={toDateStr(selectedUser.createdAt)} />
            </div>

            {/* Stats */}
            <div style={s.statsRow}>
              <div style={s.statBox}>
                <p style={s.statNum}>{userPostCount}</p>
                <p style={s.statLabel}>โพสต์ทั้งหมด</p>
              </div>
              <div style={{ ...s.statBox, borderColor: reportCount > 0 ? "#ef9a9a" : "#f0e6dc" }}>
                <p style={{ ...s.statNum, color: reportCount > 0 ? "#c62828" : "#5A4633" }}>
                  {reportCount > 0 ? `🚩 ${reportCount}` : reportCount}
                </p>
                <p style={s.statLabel}>โพสต์ถูก Report</p>
              </div>
            </div>

            {/* Ban action */}
            {!confirmBan ? (
              <button
                style={{
                  ...s.actionBtn,
                  background: selectedUser.banned ? "#e8f5e9" : "#ffebee",
                  color: selectedUser.banned ? "#2e7d32" : "#c62828",
                  border: `1px solid ${selectedUser.banned ? "#a5d6a7" : "#ef9a9a"}`,
                }}
                onClick={() => setConfirmBan(true)}
              >
                {selectedUser.banned ? "🔓 ปลดแบน User นี้" : "🚫 แบน User นี้"}
              </button>
            ) : (
              <div style={s.confirmBox}>
                <p style={s.confirmText}>
                  {selectedUser.banned
                    ? `ยืนยันปลดแบน "${selectedUser.username ?? selectedUser.email}" ?`
                    : `ยืนยันแบน "${selectedUser.username ?? selectedUser.email}" ?\nUser จะไม่สามารถใช้งานแอปได้`}
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    style={{ ...s.confirmBtn, background: "#f5f5f5", color: "#5A4633" }}
                    onClick={() => setConfirmBan(false)}
                    disabled={actionLoading}
                  >
                    ยกเลิก
                  </button>
                  <button
                    style={{
                      ...s.confirmBtn,
                      background: selectedUser.banned ? "#2e7d32" : "#c62828",
                      color: "#fff",
                    }}
                    onClick={handleToggleBan}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "กำลังดำเนินการ…" : "ยืนยัน"}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

// ── InfoRow ────────────────────────────────────────────────────────────────
function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
      <span style={{ fontSize: 12, color: "#a0856a", fontWeight: 700, minWidth: 90, paddingTop: 1 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          color: "#5A4633",
          fontFamily: mono ? "monospace" : "inherit",
          wordBreak: "break-all",
        }}
      >
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
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    color: "#5A4633",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: 13,
    color: "#a0856a",
    marginTop: 4,
    marginLeft: 4,
  },
  badge: {
    background: "rgba(255,255,255,0.7)",
    border: "1px solid #f0e6dc",
    borderRadius: 20,
    padding: "8px 18px",
    fontSize: 13,
    color: "#a0856a",
    fontWeight: 600,
    backdropFilter: "blur(8px)",
  },

  // Filter
  filterBox: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap" as const,
    background: "rgba(255,255,255,0.7)",
    borderRadius: 16,
    padding: "14px 18px",
    border: "1px solid rgba(255,255,255,0.9)",
    boxShadow: "0 2px 12px rgba(90,70,51,0.06)",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    background: "#fff",
    border: "1px solid #e8d5c4",
    borderRadius: 12,
    padding: "7px 12px",
    gap: 8,
    flex: 1,
    minWidth: 220,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    border: "none",
    outline: "none",
    fontSize: 13,
    color: "#5A4633",
    background: "transparent",
    flex: 1,
    fontFamily: "'Sarabun', sans-serif",
  },
  clearX: {
    background: "none",
    border: "none",
    color: "#a0856a",
    cursor: "pointer",
    fontSize: 13,
    padding: 0,
    lineHeight: 1,
  },
  tabs: { display: "flex", gap: 6 },
  tab: {
    padding: "6px 16px",
    borderRadius: 20,
    border: "1px solid #e8d5c4",
    background: "transparent",
    color: "#a0856a",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Sarabun', sans-serif",
  },
  tabActive: {
    background: "#F97316",
    color: "#fff",
    border: "1px solid #F97316",
  },

  // Table
  tableWrap: {
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(12px)",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.9)",
    boxShadow: "0 2px 12px rgba(90,70,51,0.08)",
    overflowY: "auto",
    flex: 1,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 13,
  },
  th: {
    padding: "13px 16px",
    textAlign: "left" as const,
    fontSize: 11,
    fontWeight: 700,
    color: "#a0856a",
    textTransform: "uppercase" as const,
    letterSpacing: "0.7px",
    background: "#fff9f5",
    borderBottom: "1px solid #f0e6dc",
    position: "sticky",
    top: 0,
  },
  tr: {
    borderBottom: "1px solid #fdf0e8",
  },
  td: {
    padding: "12px 16px",
    color: "#5A4633",
    verticalAlign: "middle" as const,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #F97316, #FBAA58)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  countBadge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    background: "#f5f5f5",
    color: "#a0856a",
    border: "1px solid #e0e0e0",
  },
  statusBadge: {
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap" as const,
  },
  detailBtn: {
    padding: "6px 14px",
    borderRadius: 10,
    border: "1px solid #F97316",
    background: "transparent",
    color: "#F97316",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Sarabun', sans-serif",
  },
  empty: {
    padding: "60px 20px",
    textAlign: "center" as const,
    color: "#c8a882",
    fontSize: 14,
  },

  // Modal
  overlay: {
    position: "fixed" as const,
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
    maxWidth: 480,
    maxHeight: "88vh",
    overflowY: "auto" as const,
    boxShadow: "0 20px 60px rgba(90,70,51,0.22)",
    padding: "28px 30px",
    fontFamily: "'Sarabun', sans-serif",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#5A4633",
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    color: "#a0856a",
    cursor: "pointer",
    padding: "4px 8px",
  },
  userHero: {
    display: "flex",
    gap: 16,
    alignItems: "center",
    marginBottom: 20,
    padding: "16px 18px",
    background: "rgba(255,255,255,0.8)",
    borderRadius: 16,
    border: "1px solid #f0e6dc",
  },
  avatarLg: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #F97316, #FBAA58)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  section: {
    background: "rgba(255,255,255,0.8)",
    borderRadius: 16,
    padding: "16px 18px",
    marginBottom: 14,
    border: "1px solid #f0e6dc",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#a0856a",
    textTransform: "uppercase" as const,
    letterSpacing: "0.8px",
    marginBottom: 10,
    marginTop: 0,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 14,
  },
  statBox: {
    background: "rgba(255,255,255,0.8)",
    border: "1px solid #f0e6dc",
    borderRadius: 16,
    padding: "14px 18px",
    textAlign: "center" as const,
  },
  statNum: {
    fontSize: 28,
    fontWeight: 800,
    color: "#5A4633",
    margin: 0,
  },
  statLabel: {
    fontSize: 11,
    color: "#a0856a",
    fontWeight: 700,
    marginTop: 4,
    textTransform: "uppercase" as const,
    letterSpacing: "0.6px",
  },
  actionBtn: {
    width: "100%",
    padding: "13px 0",
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Sarabun', sans-serif",
    marginBottom: 4,
  },
  confirmBox: {
    background: "#fff9f5",
    border: "1px solid #f0e6dc",
    borderRadius: 14,
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  confirmText: {
    fontSize: 14,
    color: "#5A4633",
    fontWeight: 600,
    margin: 0,
    whiteSpace: "pre-line" as const,
  },
  confirmBtn: {
    flex: 1,
    padding: "10px 0",
    borderRadius: 12,
    border: "none",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Sarabun', sans-serif",
  },

  // Toast
  toast: {
    position: "fixed" as const,
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
    whiteSpace: "nowrap" as const,
  },
};
