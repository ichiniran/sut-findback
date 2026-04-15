import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, query, serverTimestamp, where } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Alert, Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { app } from "../constants/firebase";

export default function ReportModal({
  visible,
  onClose,
  selectedReason,
  setSelectedReason,
  postId,
}: {
  visible: boolean;
  onClose: () => void;
  selectedReason: string;
  setSelectedReason: (reason: string) => void;
  postId: string;
}) {
    const db = getFirestore(app);
    const auth = getAuth(app);

    // ฟังก์ชันสำหรับส่งรายงานเข้า Firestore
  const handleReport = async () => {
  if (!selectedReason || !auth.currentUser) return;

  try {
    const user = auth.currentUser;

    // 🔥 ไปดึง username จาก users collection
    let username = "";

    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists()) {
        username = userSnap.data().username || "";
      }
    } catch (e) {
      console.error("โหลด username ไม่ได้", e);
    }

    // 🔥 เช็คซ้ำก่อน
    const q = query(
      collection(db, "reports"),
      where("postId", "==", postId),
      where("reportedBy", "==", user.uid)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      Alert.alert("แจ้งเตือน", "คุณเคยรายงานโพสต์นี้แล้ว");
      return;
    }

    // ✅ เพิ่ม report (ใส่ username ไปเลย!)
    await addDoc(collection(db, "reports"), {
      postId,
      reportedBy: user.uid,
      reporterUsername: username, // ✅ ใส่ตรงนี้
      reason: selectedReason,
      status: "pending",
      createdAt: serverTimestamp(),
      reviewedAt: null,
      notified: false,
    });

    Alert.alert("ส่งรายงานแล้ว", "เราจะตรวจสอบโดยเร็วที่สุด");
    setSelectedReason("");
    onClose();

  } catch (e) {
    console.error("Report error", e);
    Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถส่งรายงานได้");
  }
};
  const slideAnim = useRef(new Animated.Value(600)).current; // เริ่มต้นซ่อนไว้ด้านล่าง
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isRendered, setIsRendered] = useState(false);
  useEffect(() => {
  if (visible) {
    setIsRendered(true);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 20,
        mass: 0.8,
        stiffness: 150,
        useNativeDriver: true,
      }),
    ]).start();

  } else {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsRendered(false);   
    });
  }
}, [visible]);
  // ต้องคง render ไว้เพื่อให้ animation ปิดทำงานได้
  if (!isRendered) return null;

  const handleClose = () => {
    // รัน animation ก่อน แล้วค่อยเรียก onClose
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const reasons = [
    { label: "ข้อมูลไม่ถูกต้อง", icon: "⚠️" },
    { label: "ไม่ใช่เจ้าของจริง", icon: "🚫" },
    { label: "เนื้อหาไม่เหมาะสม", icon: "🔞" },
    { label: "สแปม / โฆษณา", icon: "📢" },
    { label: "อื่น ๆ", icon: "💬" },
  ];

  return (
    <TouchableOpacity
      style={styles.overlay}
      onPress={handleClose}
      activeOpacity={1}
    >
      {/* Backdrop fade */}
      <Animated.View style={[styles.backdropLayer, { opacity: fadeAnim }]} />

      {/* Sheet สไลด์ขึ้น/ลง */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        onStartShouldSetResponder={() => true}
      >
        <View style={styles.handleBar} />

        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="flag-outline" size={26} color="gray" />
          </View>
          <Text style={styles.title}>รายงานโพสต์</Text>
          <Text style={styles.subtitle}>เลือกเหตุผลที่ตรงกับปัญหาที่พบ</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.reasonsContainer}>
          {reasons.map((item) => {
            const isSelected = selectedReason === item.label;
            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.item, isSelected && styles.itemSelected]}
                onPress={() => setSelectedReason(item.label)}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                  <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                    {item.label}
                  </Text>
                </View>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.submitBtn, !selectedReason && styles.submitBtnDisabled]}
            onPress={handleReport}
            disabled={!selectedReason}
            activeOpacity={0.85}
          >
            <Text style={styles.submitText}>รายงานโพสต์นี้</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>ยกเลิก</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const ACCENT = "#FF3B30";
const ACCENT_LIGHT = "#FFF0EF";
const SURFACE = "#FFFFFF";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6B7280";
const BORDER = "#F3F4F6";

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  backdropLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    width: "100%",
    backgroundColor: SURFACE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handleBar: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconWrap: {
    width: 56, height: 56,
    borderRadius: 28,
    backgroundColor: "#eaeaea",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18, fontWeight: "700",
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginBottom: 8,
  },
  reasonsContainer: {
    gap: 4,
    marginBottom: 24,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
    backgroundColor: "#FAFAFA",
  },
  itemSelected: {
    backgroundColor: ACCENT_LIGHT,
    borderColor: ACCENT,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemIcon: {
    fontSize: 18,
    width: 26,
    textAlign: "center",
  },
  itemText: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    fontWeight: "500",
  },
  itemTextSelected: {
    color: ACCENT,
    fontWeight: "600",
  },
  radio: {
    width: 22, height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  radioSelected: {
    borderColor: ACCENT,
  },
  radioDot: {
    width: 10, height: 10,
    borderRadius: 5,
    backgroundColor: ACCENT,
  },
  actions: {
    gap: 10,
  },
  submitBtn: {
    backgroundColor: ACCENT,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnDisabled: {
    backgroundColor: "#E5E7EB",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  cancelText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: "600",
  },
});
