import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    Timestamp,
    updateDoc,
} from "firebase/firestore";
import { Map } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "../firebase";

// ── Types ──────────────────────────────────────────────────────────────────
interface Report {
  id: string;
  postId: string;
  reportedBy: string;
  reporterUsername?: string;
  reason: string;
  status: "pending" | "reviewed";
  notified: boolean;
  createdAt: Timestamp | string | null;
  reviewedAt: Timestamp | string | null;
}

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
  status?: string;
  userId?: string;
  username?: string;   // ← เพิ่ม
  postId?: string;
  receiveLocation?: string;
  createdAt?: Timestamp | string | null;
}

interface UserInfo {
  username?: string;
  email?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const REASONS = [
  { label: "ข้อมูลไม่ถูกต้อง", icon: "⚠️" },
  { label: "ไม่ใช่เจ้าของจริง", icon: "🚫" },
  { label: "เนื้อหาไม่เหมาะสม", icon: "🔞" },
  { label: "สแปม / โฆษณา", icon: "📢" },
  { label: "อื่น ๆ", icon: "💬" },
];

const STATUS_TABS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "pending", label: "รอตรวจ" },
  { key: "reviewed", label: "ตรวจแล้ว" },
];

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

// ── Main Component ─────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  // filters
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "reviewed">("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // detail modal
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [reporterInfo, setReporterInfo] = useState<UserInfo | null>(null);
  const [postOwnerUsername, setPostOwnerUsername] = useState<string>("");
  const [postLoading, setPostLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const toDate = (val: Timestamp | string | null | undefined): Date => {
  if (!val) return new Date(0);
  if (val instanceof Timestamp) return val.toDate();
  return new Date(val);
};
  // ── Firestore listener ──
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "reports"),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
        data.sort((a, b) => {
        return toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime();
        });
                setReports(data);
        setLoading(false);
      },
      (err) => {
        console.error("reports:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Load post detail + reporter info ──
  const openDetail = async (report: Report) => {
    setSelectedReport(report);
    setSelectedPost(null);
    setReporterInfo(null);
    setPostOwnerUsername("");
    setPostLoading(true);
    try {
      const [postSnap, userSnap] = await Promise.all([
        getDoc(doc(db, "posts", report.postId)),
        getDoc(doc(db, "users", report.reportedBy)),
      ]);
      if (postSnap.exists()) {
        const postData = { id: postSnap.id, ...postSnap.data() } as Post;
        setSelectedPost(postData);

        // ดึง username เจ้าของโพสต์ — ถ้า post มี username field ใช้เลย
        // ไม่งั้น query users collection
        if (postData.username) {
          setPostOwnerUsername(postData.username);
        } else if (postData.userId) {
          try {
            const ownerSnap = await getDoc(doc(db, "users", postData.userId));
            if (ownerSnap.exists()) {
              setPostOwnerUsername((ownerSnap.data() as UserInfo).username ?? "");
            }
          } catch (_) {}
        }
      }
      if (userSnap.exists()) setReporterInfo(userSnap.data() as UserInfo);
    } catch (e) {
      console.error(e);
    }
    setPostLoading(false);
  };

  const closeDetail = () => {
    setSelectedReport(null);
    setSelectedPost(null);
    setReporterInfo(null);
    setPostOwnerUsername("");
  };

  // ── Toast helper ──
  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Action: reviewed only ──
  const handleReviewed = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "reports", selectedReport.id), {
        status: "reviewed",
        reviewedAt: Timestamp.now(),
      });
      showToast("ตรวจสอบแล้ว ไม่มีการลบโพสต์", "success");
      closeDetail();
    } catch {
      showToast("เกิดข้อผิดพลาด กรุณาลองใหม่", "error");
    }
    setActionLoading(false);
  };

  // ── Action: reject post + reviewed report ──
  const handleRejectPost = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "posts", selectedReport.postId), {
        status: "rejected",
      });
      await updateDoc(doc(db, "reports", selectedReport.id), {
        status: "reviewed",
        reviewedAt: Timestamp.now(),
      });
      showToast("ลบโพสต์เรียบร้อย และอัปเดตสถานะ report แล้ว", "success");
      closeDetail();
    } catch {
      showToast("เกิดข้อผิดพลาด กรุณาลองใหม่", "error");
    }
    setActionLoading(false);
  };

  // ── Filter ──
  const filtered = reports.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (reasonFilter !== "all" && r.reason !== reasonFilter) return false;
    const d = toDateInput(r.createdAt);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  });

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
     <style>{`
        .report-modal::-webkit-scrollbar { width: 6px; }
        .report-modal::-webkit-scrollbar-track { background: transparent; margin-top: 24px;margin-bottom: 24px;    }
        .report-modal::-webkit-scrollbar-thumb { background: #e8d5c4; border-radius: 99px; }
        .report-modal::-webkit-scrollbar-thumb:hover { background: #d4b89a; }
      `}</style>
      {/* Toast */}
      {toast && (
        <div style={{ ...s.toast, background: toast.type === "success" ? "#22c55e" : "#ef4444" }}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>🚩 Reports</h1>
          <p style={s.subtitle}>รายการแจ้งปัญหาจากผู้ใช้งาน</p>
        </div>
        <div style={s.badge}>
          รอตรวจ{" "}
          <span style={{ color: "#ef4444", fontWeight: 800 }}>
            {reports.filter((r) => r.status === "pending").length}
          </span>{" "}
          รายการ
        </div>
      </div>

      {/* Filters */}
      <div style={s.filterBox}>
        <div style={s.tabs}>
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              style={{ ...s.tab, ...(statusFilter === t.key ? s.tabActive : {}) }}
              onClick={() => setStatusFilter(t.key as any)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={s.filterRight}>
          <select
            style={s.select}
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
          >
            <option value="all">ทุกประเภท</option>
            {REASONS.map((r) => (
              <option key={r.label} value={r.label}>
                {r.icon} {r.label}
              </option>
            ))}
          </select>

          <input type="date" style={s.dateInput} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span style={{ color: "#a0856a", fontSize: 13 }}>–</span>
          <input type="date" style={s.dateInput} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />

          {(statusFilter !== "all" || reasonFilter !== "all" || dateFrom || dateTo) && (
            <button
              style={s.clearBtn}
              onClick={() => {
                setStatusFilter("all");
                setReasonFilter("all");
                setDateFrom("");
                setDateTo("");
              }}
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
          <div style={s.empty}>ไม่พบรายการที่ตรงกับเงื่อนไข</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {[ "POST ID", "รายงานโดย", "เหตุผล", "วันที่แจ้ง", "สถานะ", "ดูรายละเอียด"].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={s.tr}>
                 
                  {/* เจ้าของโพสต์ — แสดง postId ย่อๆ ไว้ก่อน load ตอนเปิด modal */}
                  <td style={{ ...s.td, ...s.mono }}>{r.postId.slice(0, 10)}…</td>

                 
                  <td style={s.td}>
                    {r.reporterUsername ? `@${r.reporterUsername}` : r.reportedBy.slice(0, 10) + "…"}
                    </td>

                  <td style={s.td}>
                    <span style={s.reasonTag}>
                      {REASONS.find((x) => x.label === r.reason)?.icon ?? "💬"} {r.reason}
                    </span>
                  </td>
                  <td style={s.td}>{toDateStr(r.createdAt)}</td>
                  <td style={s.td}>
                    <span
                      style={{
                        ...s.statusBadge,
                        background: r.status === "pending" ? "#fff3e0" : "#e8f5e9",
                        color: r.status === "pending" ? "#e65100" : "#2e7d32",
                        border: `1px solid ${r.status === "pending" ? "#ffcc80" : "#a5d6a7"}`,
                      }}
                    >
                      {r.status === "pending" ? "⏳ รอตรวจ" : "✅ ตรวจแล้ว"}
                    </span>
                  </td>
                  <td style={s.td}>
                    <button style={s.detailBtn} onClick={() => openDetail(r)}>
                      ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal ── */}
      {selectedReport && (
        <div style={s.overlay} onClick={closeDetail}>
          <div style={s.modal} className="report-modal" onClick={(e) => e.stopPropagation()}>
             <div className="report-modal" style={{ overflowY: "auto", padding: "28px 30px", flex: 1 , scrollbarWidth: "thin", scrollbarColor: "#e8d5c4 transparent" }}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>🔍 รายละเอียด Report</h2>
              <button style={s.closeBtn} onClick={closeDetail}>✕</button>
            </div>

            {/* Report Info */}
            <div style={s.section}>
              <p style={s.sectionTitle}>ข้อมูลการแจ้ง</p>
              <div style={s.infoGrid}>
                <InfoRow label="Report ID" value={selectedReport.id} mono />
                <InfoRow label="Post ID" value={selectedReport.postId} mono />
                <InfoRow
                  label="รายงานโดย"
                  value={
                    reporterInfo?.username
                      ? `@${reporterInfo.username}`
                      : reporterInfo?.email
                      ? reporterInfo.email
                      : selectedReport.reportedBy.slice(0, 16) + "…"
                  }
                />
                <InfoRow
                  label="เหตุผล"
                  value={`${REASONS.find((x) => x.label === selectedReport.reason)?.icon ?? "💬"} ${selectedReport.reason}`}
                />
                <InfoRow label="วันที่แจ้ง" value={toDateStr(selectedReport.createdAt)} />
                <InfoRow
                  label="สถานะ"
                  value={selectedReport.status === "pending" ? "⏳ รอตรวจสอบ" : "✅ ตรวจแล้ว"}
                />
                {selectedReport.reviewedAt && (
                  <InfoRow label="ตรวจเมื่อ" value={toDateStr(selectedReport.reviewedAt)} />
                )}
              </div>
            </div>

            {/* Post Info */}
            <div style={s.section}>
              <p style={s.sectionTitle}>ข้อมูลโพสต์ที่ถูกแจ้ง</p>
              {postLoading ? (
                <p style={{ color: "#a0856a", fontSize: 13 }}>กำลังโหลดโพสต์...</p>
              ) : selectedPost ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                  {/* Type badge + status */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span
                      style={{
                        ...s.typeBadge,
                        background: selectedPost.type === "found" ? "#e8f5e9" : "#fff3e0",
                        color: selectedPost.type === "found" ? "#2e7d32" : "#e65100",
                      }}
                    >
                      {selectedPost.type === "found" ? "พบของ" : "ของหาย"}
                    </span>
                    {selectedPost.status === "rejected" && (
                      <span style={{ ...s.typeBadge, background: "#ffebee", color: "#c62828" }}>
                        🗑️ ถูกลบแล้ว
                      </span>
                    )}
                  </div>
                    
                  {/* ── รูปภาพโพสต์ ── */}
                  {selectedPost.images && selectedPost.images.length > 0 && (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "nowrap",
                          justifyContent: "flex-start",
                          alignItems: "flex-start",
                        }}
                      >
                        {selectedPost.images.slice(0, 3).map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            onClick={() => setPreviewImage(url)} 
                            alt={`img-${i}`}
                            style={{
                              width: 100,
                              height: 100,
                              borderRadius: 10,
                              objectFit: "cover",
                              border: "1px solid #f0e6dc",
                              flexShrink: 0,
                              cursor: "pointer",
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {previewImage && (
                    <div
                        onClick={() => setPreviewImage(null)}
                        style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2000,
                        }}
                    >
                        <img
                        src={previewImage}
                        style={{
                            maxWidth: "90%",
                            maxHeight: "90%",
                            borderRadius: 16,
                            objectFit: "contain",
                        }}
                        />
                    </div>
                    )}
                  {/* Info rows */}
                  <div>
                    {postOwnerUsername && (
                      <InfoRow label="เจ้าของโพสต์" value={`@${postOwnerUsername}`} />
                    )}
                    <InfoRow label="หมวดหมู่" value={selectedPost.category ?? "-"} />
                    <InfoRow label="รายละเอียด" value={selectedPost.detail ?? "-"} />
                    <InfoRow label="วันที่" value={selectedPost.date ?? toDateStr(selectedPost.createdAt)} />
                    <InfoRow label="สถานที่" value={selectedPost.locationName ?? selectedPost.location ?? "-"} />
                    {selectedPost.locationDetail && (
                      <InfoRow label="รายละเอียดสถานที่" value={selectedPost.locationDetail} />
                    )}
                    {selectedPost.latitude && selectedPost.longitude && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6,textAlign: "left",      }}>
                            {/* label */}
                            <span
                            style={{
                                fontSize: 12,
                                color: "#a0856a",
                                fontWeight: 700,
                                minWidth: 110,
                            }}
                            >
                            พิกัดสถานที่
                            </span>

                            {/* value + link */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <a
                                href={`https://www.google.com/maps?q=${selectedPost.latitude},${selectedPost.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                display: "inline-flex",          
                                alignItems: "center",         
                                gap: 4,                         
                                fontSize: 11,                    
                                color: "#F97316",
                                fontWeight: 700,
                                textDecoration: "none",
                                background: "#fff7f0",
                                border: "1px solid #f0e6dc",
                                borderRadius: 8,
                                padding: "3px 8px",              
                                lineHeight: 1,                  
                            }}
                            >
                                <Map size={16}  style={{ marginRight: 4 }} />
                                เปิดแผนที่ใน Google Maps
                            </a>
                            </div>

                        </div>
                        )}
                      <InfoRow  label="สถานที่รับคืน" value={selectedPost.receiveLocation ?? "-"} />
                      {selectedPost.receiveLocationImage && (
                        <div
                            style={{
                            display: "flex",
                            gap: 8,
                            marginBottom: 6,
                            alignItems: "flex-start",
                            }}
                        >
                            {/* label */}
                            <span
                            style={{
                                fontSize: 12,
                                color: "#a0856a",
                                fontWeight: 700,
                                minWidth: 110,
                                textAlign: "left",
                            }}
                            >
                            รูปจุดรับคืน
                            </span>

                            {/* image */}
                            <img
                            src={selectedPost.receiveLocationImage}
                            onClick={() => setPreviewImage(selectedPost.receiveLocationImage!)}
                            alt="receive location"
                            style={{
                                width: 80,
                                cursor: "pointer",
                                height: 80,
                                borderRadius: 12,
                                objectFit: "cover",
                                border: "1px solid #f0e6dc",
                            }}
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                            }}
                            />
                        </div>
                        )}
                  </div>
                </div>
              ) : (
                <p style={{ color: "#ef4444", fontSize: 13 }}>ไม่พบข้อมูลโพสต์ (อาจถูกลบแล้ว)</p>
              )}
            </div>

            {/* Actions */}
            {selectedReport.status === "pending" && (
              <div style={s.actionRow}>
                <button
                  style={{ ...s.actionBtn, ...s.btnReviewed }}
                  onClick={handleReviewed}
                  disabled={actionLoading}
                >
                  ตรวจสอบแล้ว (ไม่ลบโพสต์)
                </button>
                <button
                  style={{
                    ...s.actionBtn,
                    ...s.btnReject,
                    opacity: selectedPost?.status === "rejected" ? 0.5 : 1,
                  }}
                  onClick={handleRejectPost}
                  disabled={actionLoading || selectedPost?.status === "rejected"}
                >
                  ลบโพสต์
                </button>
              </div>
            )}

            {selectedReport.status === "reviewed" && (
              <div style={s.reviewedNote}>
                ✅ Report นี้ได้รับการตรวจสอบแล้ว
                {selectedReport.reviewedAt && ` เมื่อ ${toDateStr(selectedReport.reviewedAt)}`}
              </div>
            )}

          </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── InfoRow ────────────────────────────────────────────────────────────────
function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginBottom: 6,
        alignItems: "flex-start",
        justifyContent: "flex-start", 
        textAlign: "left",           
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: "#a0856a",
          fontWeight: 700,
          minWidth: 110,
          textAlign: "left",     
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontSize: 13,
          color: "#5A4633",
          fontFamily: mono ? "monospace" : "inherit",
          wordBreak: "break-all",
          textAlign: "left",         
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Styles (เหมือนเดิมทั้งหมด) ──────────────────────────────────────────────
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
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 26, fontWeight: 800, color: "#5A4633", margin: 0, letterSpacing: "-0.5px" },
  subtitle: { fontSize: 13, color: "#a0856a", marginTop: 4, marginLeft: 4 },
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
    transition: "all 0.18s",
  },
  tabActive: { background: "#F97316", color: "#fff", border: "1px solid #F97316" },
  filterRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginLeft: "auto",
    flexWrap: "wrap" as const,
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
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
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
  },
  tr: { borderBottom: "1px solid #fdf0e8", transition: "background 0.15s" },
  td: { padding: "13px 16px", color: "#5A4633", verticalAlign: "middle" as const },
  mono: { fontFamily: "monospace", fontSize: 12, color: "#a0856a" },
  reasonTag: {
    background: "#fff7f0",
    border: "1px solid #f0e6dc",
    borderRadius: 8,
    padding: "3px 10px",
    fontSize: 12,
    color: "#5A4633",
    whiteSpace: "nowrap" as const,
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
    transition: "all 0.15s",
  },
  empty: { padding: "60px 20px", textAlign: "center" as const, color: "#c8a882", fontSize: 14 },
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
  maxWidth: 620,
  maxHeight: "88vh",
  overflow: "hidden",        // ← hidden ไม่ใช่ auto
  display: "flex",           // ← เพิ่ม
  flexDirection: "column",   // ← เพิ่ม
  boxShadow: "0 20px 60px rgba(90,70,51,0.22)",
  fontFamily: "'Sarabun', sans-serif",

},
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
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
    textTransform: "uppercase" as const,
    letterSpacing: "0.8px",
    marginBottom: 12,
    marginTop: 0,
  },
  infoGrid: { display: "flex", flexDirection: "column" as const, gap: 2 },
  typeBadge: { padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 },
  actionRow: { display: "flex", gap: 10, marginTop: 4 },
  actionBtn: {
    flex: 1,
    padding: "12px 0",
    borderRadius: 14,
    border: "none",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Sarabun', sans-serif",
    transition: "opacity 0.15s",
  },
  btnReviewed: { background: "#e8f5e9", color: "#2e7d32", border: "1px solid #a5d6a7" },
  btnReject: { background: "#ffebee", color: "#c62828", border: "1px solid #ef9a9a" },
  reviewedNote: {
    background: "#e8f5e9",
    color: "#2e7d32",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 13,
    fontWeight: 600,
    textAlign: "center" as const,
    marginTop: 4,
  },
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