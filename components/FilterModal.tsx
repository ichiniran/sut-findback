import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
const LOCATIONS = [
  'อาคารเรียนรวม 1',
  'อาคารเรียนรวม 2',
  'อาคารเครื่องมือ 1 (F1)',
  'อาคารเครื่องมือ 2 (F2)',
  'อาคารเครื่องมือ 3 (F3)',
  'อาคารเครื่องมือ 4 (F4)',
  'อาคารเครื่องมือ 5 (F5)',
  'อาคารเครื่องมือ 6 (F6)',
  'อาคารเครื่องมือ 7 (F7)',
  'อาคารเฉลิมพระเกียรติ 72 พรรษา (F9)',
  'อาคารเครื่องมือ 10 (F10)',
  'อาคารสิรินธรวิศวพัฒน์ (F11)',
  'อาคารเทพรัตน์วิทยรักษ์ (F12)',
  'อาคารเกษตรภิวัฒน์ (F14)',
  'อาคารรัฐสีมาคุณากร (ตึกดิจิทัล)',
  'โรงเรียนสุรวิวัฒน์',
  'อาคารบริหาร',
  'อาคารวิชาการ 1',
  'อาคารวิชาการ 2',
  'อาคารขนส่ง มทส',
  'อาคารบรรณาสาร',
  'สำนักงานสภานักศึกษา',
  'สำนักงานสภานักศึกษา (อาคารกิจการนักศึกษา เก่า) ',
  'งานทุนการศึกษา มทส.',
  'ส่วนกิจการนักศึกษา',
  'กลุ่มอาคารกิจกรรมนักศึกษาสุรเริงไชย',
  'สนามสุรพลากรีฑาสถาน',
  'SUT Sport and Health Center (สถานกีฬาและสุขภาพ)',
  'อาคารกีฬาภิรมย์ มทส.',
  'ลานหมอลำ (ลานศิลปะวัฒนธรรม)',
  'ศูนย์สหกิจศึกษาและพัฒนาอาชีพ มหาวิทยาลัยเทคโนโลยีสุรนารี',
  'อาคารเฉลิมพระเกียรติ 80 พรรษา',
  'เทคโนธานี (อาคารสุรพัฒน์ 1)',
  'อาคารสุรพัฒน์ 2',
  'ฟาร์มมหาวิทยาลัย',
  'โรงอาหารกาสะลองคำ',
  'โรงอาหารครัวท่านท้าว',
  'โรงอาหารดอนตะวัน',
  'โรงอาหารพราวแสดทอง',
  'โรงเตี๊ยม มทส.',
  'โรงอาหารเรียนรวม 2',
  'หอพักสุรนิเวศ 1 (S1)',
  'หอพักสุรนิเวศ 2 (S2)',
  'หอพักสุรนิเวศ 3 (S3)',
  'หอพักสุรนิเวศ 4 (S4)',
  'หอพักสุรนิเวศ 5 (S5)',
  'หอพักสุรนิเวศ 6 (S6)',
  'หอพักสุรนิเวศ 7 (S7)',
  'หอพักสุรนิเวศ 8 (S8)',
  'หอพักสุรนิเวศ 9 (S9)',
  'หอพักสุรนิเวศ 10 (S10)',
  'หอพักสุรนิเวศ 11 (S11)',
  'หอพักสุรนิเวศ 12 (S12)',
  'หอพักสุรนิเวศ 13 (S13)',
  'หอพักสุรนิเวศ 14 (S14)',
  'หอพักสุรนิเวศ 15 (S15)',
  'หอพักสุรนิเวศ 16 (S16)',
  'หอพักสุรนิเวศ 17 (S17)',
  'หอพักสุรนิเวศ 18 (S18)',
  'หอพักสุรนิเวศ 19 (S19)',
  'หอพักสุรนิเวศ 20 (S20)',
  'หอพักสุรนิเวศ 21 (S21)',
  'หอพักสุรนิเวศ 22 (S22)',
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
  const [locationSearch, setLocationSearch] = useState('');
  const [filteredLocations, setFilteredLocations] = useState(LOCATIONS);
  const handleClear = () => {
  setCategory('ทั้งหมด');
  setLocation('ทั้งหมด');
  setUseDateRange(false);
  setDateFrom('');

  onApply({
    category: 'ทั้งหมด',
    location: 'ทั้งหมด',
    dateFrom: '',
  });

  onClose(); // ปิด modal
};

  const handleApply = () => {
    onApply({ category, location, dateFrom: useDateRange ? dateFrom : '' });
    onClose();
  };
const translateY = useRef(new Animated.Value(300)).current;
const opacity = useRef(new Animated.Value(0)).current;

useEffect(() => {
  const filtered = LOCATIONS.filter(loc =>
    loc.toLowerCase().includes(locationSearch.toLowerCase())
  );
  setFilteredLocations(filtered);
}, [locationSearch]);


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
      <KeyboardAvoidingView  style={{ flex: 1 }}  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container}>
          <TouchableOpacity  activeOpacity={1}  style={StyleSheet.absoluteFill}  onPress={onClose} >
              <Animated.View style={[styles.backdrop, { opacity }]} />
           </TouchableOpacity>
      <View style={styles.sheet}>
           <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false} >

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
        

            <TextInput
              placeholder="ค้นหาสถานที่..."
              value={locationSearch}
              onChangeText={setLocationSearch}
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 10,
                padding: 10,
                marginBottom: 10,
              }}
            />

            <ScrollView style={{ maxHeight: 150 }}>
              {filteredLocations.map(item => (
                <TouchableOpacity
                  key={item}
                  onPress={() => {
                    setLocation(item);
                    setLocationSearch(item);
                  }}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderColor: '#eee',
                  }}
                >
                  <Text style={{ color: '#333' }}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

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
      </KeyboardAvoidingView>
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