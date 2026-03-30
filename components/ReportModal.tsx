import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ReportModal({
  visible,
  onClose,
  selectedReason,
  setSelectedReason,
  onSubmit,
}: any) {
  if (!visible) return null;

  const reasons = [
    "ข้อมูลไม่ถูกต้อง",
    "ไม่ใช่เจ้าของจริง",
    "เนื้อหาไม่เหมาะสม",
    "สแปม / โฆษณา",
    "อื่น ๆ",
  ];

  return (
    <View style={styles.overlay}>
      <View style={styles.box}>
        <Text style={styles.title}>เลือกเหตุผลในการรายงานโพสต์</Text>

        {reasons.map((item) => (
          <TouchableOpacity
            key={item}
            style={styles.item}
            onPress={() => setSelectedReason(item)}
          >
            <Text style={styles.text}>{item}</Text>
            <View style={styles.radio}>
              {selectedReason === item && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.btn} onPress={onSubmit}>
          <Text style={{ fontWeight: "600" }}>รายงาน</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose}>
          <Text style={{ textAlign: "center", marginTop: 10 }}>ยกเลิก</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  text: {
    fontSize: 14,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#999",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#000",
  },
  btn: {
    marginTop: 16,
    backgroundColor: "#eee",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
});