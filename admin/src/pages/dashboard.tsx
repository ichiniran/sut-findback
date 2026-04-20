import { collection, onSnapshot } from "firebase/firestore";
import {
  BarChart3,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  PackageSearch,
  PieChart as PieChartIcon,
  ShieldAlert,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { db } from "../firebase";

export default function DashboardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    const unsubPosts = onSnapshot(
      collection(db, "posts"),
      (snap) => {
        setPosts(snap.docs.map((d) => d.data()));
      },
      (err) => console.error("posts:", err)
    );

    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        setUserCount(snap.size);
      },
      (err) => console.error("users:", err)
    );

    const unsubReports = onSnapshot(
      collection(db, "reports"),
      (snap) => {
        setReports(snap.docs.map((d) => d.data()));
      },
      (err) => console.error("reports:", err)
    );

    return () => {
      unsubPosts();
      unsubUsers();
      unsubReports();
    };
  }, []);

  const found = posts.filter((p) => p.type === "found").length;
  const lost = posts.filter((p) => p.type === "lost").length;
  const pending = reports.filter((r) => r.status === "pending").length;

  const today = new Date().toISOString().slice(0, 10);

  const getDateStr = (createdAt: any): string => {
    if (!createdAt) return "";
    if (typeof createdAt === "string") return createdAt.slice(0, 10);
    if (typeof createdAt.toDate === "function") {
      return createdAt.toDate().toISOString().slice(0, 10);
    }
    return "";
  };

  const todayFound = posts.filter(
    (p) => p.type === "found" && getDateStr(p.createdAt) === today
  ).length;

  const todayLost = posts.filter(
    (p) => p.type === "lost" && getDateStr(p.createdAt) === today
  ).length;

  const categoryMap: Record<string, number> = {};
  posts.forEach((p) => {
    const cat = p.category || "อื่น ๆ";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const pieData = Object.keys(categoryMap).map((k) => ({
    name: k,
    value: categoryMap[k],
  }));

  const COLORS = ["#FBAA58", "#F97316", "#5A4633", "#f59e0b", "#ef4444", "#22c55e"];

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <h1 style={{ ...s.title, display: "flex", alignItems: "center", gap: 10 }}>
                      <LayoutDashboard size={24} /> Dashboard
                  </h1>
                  <p style={s.subtitle}>จัดการผู้ใช้งานในระบบ</p>
                </div>
        <div style={s.dateBadge}>
          <Calendar size={16} />
          <span>
            {new Date().toLocaleDateString("th-TH", { dateStyle: "long" })}
          </span>
        </div>
      </div>

      <div style={s.cardGrid}>
        <StatCard
          label="โพสต์ทั้งหมด"
          value={posts.length}
          icon={<ClipboardList size={20} />}
          accent="#F97316"
          iconColor="#F97316"
          iconBg="#FFF1E8"
          sub={`พบ ${found} · หาย ${lost}`}
        />

        <StatCard
          label="ผู้ใช้งาน"
          value={userCount}
          icon={<Users size={20} />}
          accent="#5A4633"
          iconColor="#5A4633"
          iconBg="#F4EEE8"
          sub="ผู้ใช้ที่ลงทะเบียน"
        />

        <StatCard
          label="โพสต์วันนี้"
          value={todayFound + todayLost}
          icon={<PackageSearch size={20} />}
          accent="#FBAA58"
          iconColor="#D97706"
          iconBg="#FFF7E8"
          sub={`พบ ${todayFound} · หาย ${todayLost}`}
          
        />

        <StatCard
          label="รายงานรอตรวจ"
          value={pending}
          icon={<ShieldAlert size={20} />}
          accent="#ef4444"
          iconColor="#DC2626"
          iconBg="#FEF2F2"
          sub="รอการตรวจสอบ"
        />
      </div>

      <div style={s.chartRow}>
        <div style={s.chartBox}>
          <div style={s.chartTitleWrap}>
            <div style={s.chartTitleIconBox}>
              <BarChart3 size={16} />
            </div>
            <p style={s.chartTitle}>โพสต์วันนี้</p>
          </div>

          <ResponsiveContainer width="100%" height={210}>
            <BarChart
              data={[{ name: "วันนี้", พบของ: todayFound, หายของ: todayLost }]}
              barSize={44}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 13, fill: "#a0856a" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#a0856a" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 4px 20px rgba(90,70,51,0.12)",
                  fontFamily: "Sarabun",
                }}
                cursor={{ fill: "#fff7f0" }}
              />
              <Bar dataKey="พบของ" fill="#F97316" radius={[8, 8, 0, 0]} />
              <Bar dataKey="หายของ" fill="#FBAA58" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div style={s.legend}>
            <LegendDot color="#F97316" label="พบของ" />
            <LegendDot color="#FBAA58" label="หายของ" />
          </div>
        </div>

        <div style={s.chartBox}>
          <div style={s.chartTitleWrap}>
            <div style={s.chartTitleIconBox}>
              <PieChartIcon size={16} />
            </div>
            <p style={s.chartTitle}>หมวดหมู่ยอดนิยม</p>
          </div>

          {pieData.length === 0 ? (
            <div style={s.empty}>ไม่มีข้อมูล</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    outerRadius={82}
                    innerRadius={42}
                    paddingAngle={3}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      boxShadow: "0 4px 20px rgba(90,70,51,0.12)",
                      fontFamily: "Sarabun",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div style={s.legend}>
                {pieData.map((d, i) => (
                  <LegendDot
                    key={d.name}
                    color={COLORS[i % COLORS.length]}
                    label={`${d.name} (${d.value})`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
  iconColor,
  iconBg,
  sub,
}: any) {
  return (
    <div style={s.card}>
      <div style={s.cardTop}>
        <div>
          <p style={s.cardLabel}>{label}</p>
          <h2 style={{ ...s.cardValue, color: accent }}>{value.toLocaleString()}</h2>
          <p style={s.cardSub}>{sub}</p>
        </div>

        <div
          style={{
            ...s.iconBox,
            background: iconBg,
            color: iconColor,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: any) {
  return (
    <div style={s.legendItem}>
      <div style={{ ...s.legendDot, background: color }} />
      {label}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: "32px 36px",
    background: "linear-gradient(160deg, #FFFAF5 0%, #FFEBD9 100%)",
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 24,
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

  dateBadge: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.8)",
    border: "1px solid #f0e6dc",
    borderRadius: 16,
    padding: "8px 14px",
    fontSize: 13,
    color: "#a0856a",
    fontWeight: 600,
    backdropFilter: "blur(8px)",
    boxShadow: "0 2px 10px rgba(90,70,51,0.05)",
    whiteSpace: "nowrap",
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
  },

  card: {
    background: "rgba(255,255,255,0.78)",
    backdropFilter: "blur(12px)",
    borderRadius: 20,
    padding: "20px 22px",
    boxShadow: "0 2px 12px rgba(90,70,51,0.08)",
    border: "1px solid rgba(255,255,255,0.9)",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    
  },

  cardLabel: {
    fontSize: 11,
    color: "#a0856a",
    fontWeight: 700,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    textAlign: "center",
  },

  cardValue: {
    fontSize: 36,
    fontWeight: 800,
    margin: "4px 0",
    lineHeight: 1,
    fontFamily: "'Inter', sans-serif",
  },

  cardSub: {
    fontSize: 12,
    color: "#c8a882",
    marginTop: 6,
    marginBottom: 0,
  },

  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  chartRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    flex: 1,
  },

  chartBox: {
    background: "rgba(255,255,255,0.78)",
    backdropFilter: "blur(12px)",
    borderRadius: 20,
    padding: "22px 24px 16px",
    boxShadow: "0 2px 12px rgba(90,70,51,0.08)",
    border: "1px solid rgba(255,255,255,0.9)",
  },

  chartTitleWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  chartTitleIconBox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    background: "#FFF1E8",
    color: "#F97316",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  chartTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#5A4633",
    margin: 0,
    textAlign: "center",
  },

  legend: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px 14px",
    marginTop: 10,
  },

  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "#a0856a",
  },

  legendDot: {
    width: 9,
    height: 9,
    borderRadius: "50%",
  },

  empty: {
    height: 210,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#c8a882",
    fontSize: 14,
  },
};