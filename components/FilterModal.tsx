import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const LOCATIONS = [
  'ทั้งหมด', 'อาคารเรียนรวม 1', 'อาคารเรียนรวม 2', 'อาคารเรียนรวม 3',
  'อาคารรัฐสีมาคุณากร', 'หอพักนักศึกษา', 'โรงอาหาร', 'อื่น ๆ',
];
const CATEGORIES = [
  'ทั้งหมด', 'กระเป๋า / กระเป๋าสตางค์', 'บัตรนักศึกษา / บัตรประชาชน',
  'โทรศัพท์ / อุปกรณ์อิเล็กทรอนิกส์', 'เงิน', 'กุญแจ',
  'เครื่องประดับ', 'เสื้อผ้า', 'อื่น ๆ',
];

export interface FilterOptions {
  category: string;
  location: string;
  dateFrom: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
}

export default function FilterModal({ visible, onClose, onApply }: Props) {
  const [category, setCategory] = useState('ทั้งหมด');
  const [location, setLocation] = useState('ทั้งหมด');
  const [useDateRange, setUseDateRange] = useState(false);
  const [dateFrom, setDateFrom] = useState('');

  const handleClear = () => {
    setCategory('ทั้งหมด');
    setLocation('ทั้งหมด');
    setUseDateRange(false);
    setDateFrom('');
  };

  const handleApply = () => {
    onApply({ category, location, dateFrom: useDateRange ? dateFrom : '' });
    onClose();
  };
const translateY = useRef(new Animated.Value(300)).current;
const opacity = useRef(new Animated.Value(0)).current;

useEffect(() => {
  if (visible) {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  } else {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 300, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }
}, [visible]);


  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
        <View style={styles.container}>
     <Animated.View style={[styles.backdrop, { opacity }]} />
   
      <View style={styles.sheet}>
           <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>ตัวกรอง</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          {/* ประเภทสิ่งของ */}
          <Text style={styles.sectionLabel}>ประเภทสิ่งของ</Text>
          <View style={styles.chipWrap}>
            {CATEGORIES.map(item => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, category === item && styles.chipActive]}
                onPress={() => setCategory(item)}
              >
                <Text style={[styles.chipText, category === item && styles.chipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* สถานที่ */}
          <Text style={styles.sectionLabel}>สถานที่</Text>
          <View style={styles.chipWrap}>
            {LOCATIONS.map(item => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, location === item && styles.chipActive]}
                onPress={() => setLocation(item)}
              >
                <Text style={[styles.chipText, location === item && styles.chipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* วันที่ */}
          <Text style={styles.sectionLabel}>วันที่</Text>
          <TouchableOpacity style={styles.radioRow} onPress={() => setUseDateRange(false)}>
            <View style={[styles.radio, !useDateRange && styles.radioActive]} />
            <Text style={styles.radioLabel}>วันนี้</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.radioRow} onPress={() => setUseDateRange(true)}>
            <View style={[styles.radio, useDateRange && styles.radioActive]} />
            <Text style={styles.radioLabel}>ระบุช่วงวันที่</Text>
          </TouchableOpacity>
          {useDateRange && (
            <View style={styles.dateInputRow}>
              <Text style={styles.dateLabel}>ตั้งแต่วันที่</Text>
              <View style={styles.dateInput}>
                <TextInput
                  placeholder="วว/ดด/ปปปป"
                  placeholderTextColor="#bbb"
                  value={dateFrom}
                  onChangeText={setDateFrom}
                  keyboardType="numeric"
                  maxLength={10}
                  style={{ flex: 1, fontSize: 14, color: '#333' }}
                />
                <Ionicons name="calendar-outline" size={18} color="#FBAA58" />
              </View>
            </View>
          )}

        </ScrollView>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btnClear} onPress={handleClear}>
            <Text style={styles.btnClearText}>ล้าง</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnApply} onPress={handleApply}>
            <Text style={styles.btnApplyText}>ตกลง</Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(0,0,0,0.3)',
},
  sheet: {
  backgroundColor: '#fff',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  paddingTop: 12,
  paddingHorizontal: 20,
  paddingBottom: 20,
  maxHeight: '80%',
},
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#333' },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#5A4633', marginTop: 16, marginBottom: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#ddd' },
  radioActive: { borderColor: '#F97316', backgroundColor: '#F97316' },
  radioLabel: { fontSize: 14, color: '#333' },
  dateInputRow: { marginTop: 10 },
  dateLabel: { fontSize: 13, color: '#777', marginBottom: 6 },
  dateInput: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#F0E6DA', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btnClear: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center',
  },
  btnClearText: { fontSize: 15, color: '#555', fontWeight: '600' },
  btnApply: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F97316', alignItems: 'center' },
  btnApplyText: { fontSize: 15, color: '#fff', fontWeight: '600' },
  container: {
  flex: 1,
  justifyContent: 'flex-end', // 🔥 ทำให้มันติดล่าง
},
handle: {
  width: 40,
  height: 4,
  backgroundColor: '#ddd',
  borderRadius: 2,
  alignSelf: 'center',
  marginBottom: 12,
},
});