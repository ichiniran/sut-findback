import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { WebView } from 'react-native-webview';
import { app } from '../constants/firebase';

const GOOGLE_API_KEY = 'AIzaSyBQTaITdWwgKSrlTHPunVf5saxtVQdLpCE';

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
  'สำนักงานสภานักศึกษา (อาคารกิจการนักศึกษา เก่า)',
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
  'กระเป๋า / กระเป๋าสตางค์', 'บัตรนักศึกษา / บัตรประชาชน',
  'โทรศัพท์ / อุปกรณ์อิเล็กทรอนิกส์', 'เงิน', 'กุญแจ',
  'เครื่องประดับ', 'เสื้อผ้า', 'อื่น ๆ',
];

// จุดกลาง มทส. เป็น fallback ก่อนได้ GPS
const SUT_DEFAULT = { latitude: 14.8775, longitude: 102.0170 };

const todayFormatted = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear() + 543}`;
};

const uploadToCloudinary = async (localUri: string): Promise<string> => {
  if (localUri.startsWith('http')) return localUri;
  const formData = new FormData();
  formData.append('file', { uri: localUri, type: 'image/jpeg', name: 'photo.jpg' } as any);
  formData.append('upload_preset', 'nxbvgcct');
  formData.append('cloud_name', 'dto2v8z6t');
  const res = await fetch('https://api.cloudinary.com/v1_1/dto2v8z6t/image/upload', { method: 'POST', body: formData });
  const data = await res.json();
  if (!data.secure_url) throw new Error('Upload failed');
  return data.secure_url;
};

// พื้นที่ค้นหา: รัศมี ~5 กม. รอบ มทส. (viewbox สำหรับ Nominatim)
// SW: 14.860, 101.995  NE: 14.900, 102.045
const SUT_VIEWBOX = '101.995,14.860,102.045,14.900'; // left,bottom,right,top

// แปลงชื่อสถานที่ใน list → lat/lng ผ่าน Google Places (จำกัดพื้นที่ มทส.)
const getLatLngFromName = async (name: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    // locationrestriction บังคับให้ผลอยู่ในวงกลม 5 กม. รอบ มทส. เท่านั้น
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(name + ' มหาวิทยาลัยเทคโนโลยีสุรนารี')}&inputtype=textquery&fields=geometry&locationbias=circle:5000@14.8775,102.0170&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const loc = data.candidates?.[0]?.geometry?.location;
    return loc ? { lat: loc.lat, lng: loc.lng } : null;
  } catch { return null; }
};

// ค้นหาสถานที่ทั่วไปผ่าน Nominatim — จำกัดพื้นที่รอบ มทส. ด้วย viewbox + bounded
const searchNominatim = async (query: string): Promise<any[]> => {
  try {
    const headers = { 'Accept-Language': 'th', 'User-Agent': 'SUT-FindBack-App' };
    // bounded=1 บังคับให้ผลลัพธ์อยู่ใน viewbox เท่านั้น
    let res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&viewbox=${SUT_VIEWBOX}&bounded=1`,
      { headers }
    );
    let data = await res.json();
    // fallback: ถ้าไม่เจอใน bounded area → ค้นในพื้นที่ใหญ่ขึ้นแต่ยังเพิ่ม keyword มทส.
    if (data.length === 0) {
      res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' มหาวิทยาลัยเทคโนโลยีสุรนารี นครราชสีมา')}&format=json&limit=5`,
        { headers }
      );
      data = await res.json();
    }
    return data;
  } catch { return []; }
};

// reverse geocode → ชื่อสถานที่
const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
    const data = await res.json();
    return data.display_name || '';
  } catch { return ''; }
};

export default function PostForm() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const type = (params.type as string) === 'lost' ? 'lost' : 'found';
  const isFound = type === 'found';
  const isEdit = params.mode === 'edit';
  const postId = params.postId as string;
  // form state
  const [images, setImages] = useState<string[]>([]);
  const [receiveLocationImage, setReceiveLocationImage] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [showCategoryDD, setShowCategoryDD] = useState(false);
  const [otherCategory, setOtherCategory] = useState('');
  const [detail, setDetail] = useState('');
  const [date, setDate] = useState<string>(todayFormatted());
  const [receiveLocation, setReceiveLocation] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [receiveLocationImageDeleted, setReceiveLocationImageDeleted] = useState(false);
  // location / map state
  const [locationSearch, setLocationSearch] = useState('');       // ข้อความในช่อง
  const [showLocationDD, setShowLocationDD] = useState(false);
  const [markerCoord, setMarkerCoord] = useState(SUT_DEFAULT);   // พิกัดหมุด (เริ่มที่ มทส.)
  const [displayName, setDisplayName] = useState('');             // ชื่อที่แสดงใต้แผนที่
  const [confirmed, setConfirmed] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);  // ผลลัพธ์ Nominatim
  const [searching, setSearching] = useState(false);
  const [mapKey, setMapKey] = useState(0); // force re-render WebView เมื่อพิกัดเปลี่ยน

  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<any>(null);
  const [mapScrollLocked, setMapScrollLocked] = useState(false);
  const searchTimeout = useRef<any>(null);

  const label = {
    header: isFound ? 'แจ้งพบของ' : 'แจ้งของหาย',
    category: isFound ? 'ประเภทของที่พบ' : 'ประเภทของที่หาย',
    categoryPlaceholder: isFound ? 'เลือกประเภทสิ่งของที่พบ' : 'เลือกประเภทสิ่งของที่หาย',
    categoryOther: isFound ? 'โปรดระบุประเภทสิ่งของที่พบ' : 'โปรดระบุประเภทสิ่งของที่หาย',
    detail: isFound ? 'อธิบายลักษณะของที่พบ...' : 'อธิบายลักษณะของที่หาย...',
    dateLabel: isFound ? 'วันที่พบ' : 'วันที่หาย',
    locationLabel: isFound ? 'สถานที่พบ' : 'สถานที่หาย',
  };

  const resetForm = () => {
    setImages([]); setReceiveLocationImage(null);
    setCategory(''); setOtherCategory(''); setDetail('');
    setLocationSearch(''); setShowLocationDD(false);
    setMarkerCoord(SUT_DEFAULT); setDisplayName('');
    setConfirmed(false); setSearchResults([]);
    setLocationDetail(''); setReceiveLocation('');
    setDate(todayFormatted());
    setReceiveLocationImageDeleted(false);
  };

  // ── ย้ายหมุด + force re-render map ───────────────────────
  const moveTo = (lat: number, lng: number, name?: string) => {
    setMarkerCoord({ latitude: lat, longitude: lng });
    if (name !== undefined) setDisplayName(name);
    setConfirmed(false);
    setMapKey(k => k + 1);
  };

  // ── init: GPS หรือ populate edit ─────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollToPosition(0, 0, false);

    if (isEdit) {
      setCategory(params.category as string || '');
      setDetail(params.detail as string || '');
      setLocationDetail(params.locationDetail as string || '');
      setReceiveLocation(params.receiveLocation as string || '');
      setDate(params.date as string || todayFormatted());

      const savedName = (params.locationName as string) || (params.location as string) || '';
      setLocationSearch(savedName);
      setDisplayName(savedName);

      if (params.latitude && params.longitude) {
        const lat = parseFloat(params.latitude as string);
        const lng = parseFloat(params.longitude as string);
        setMarkerCoord({ latitude: lat, longitude: lng });
        setConfirmed(true);
        setMapKey(k => k + 1);
      }
      if (params.images) {
        try { setImages(JSON.parse(params.images as string)); }
        catch { setImages([params.images as string]); }
      }
      if (params.receiveLocationImage) setReceiveLocationImage(params.receiveLocationImage as string);
    } else {
      resetForm();
      // ดึง GPS เพื่อเริ่มต้นหมุด (ไม่ set confirmed อัตโนมัติ)
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          moveTo(loc.coords.latitude, loc.coords.longitude);
        }
      })();
    }
  }, [isEdit, type]);

  const handleDateChange = (text: string) => {
    const d = text.replace(/\D/g, '');
    let f = d;
    if (d.length >= 3 && d.length <= 4) f = `${d.slice(0, 2)}/${d.slice(2)}`;
    else if (d.length >= 5) f = `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4, 8)}`;
    setDate(f);
  };

  // เลือกจาก LOCATIONS → ดึง lat/lng ผ่าน Google Places
  const selectFromList = async (name: string) => {
    setLocationSearch(name);
    setShowLocationDD(false);
    setSearchResults([]);
    setSearching(true);
    const coords = await getLatLngFromName(name);
    setSearching(false);
    if (coords) {
      moveTo(coords.lat, coords.lng, name);
    } else {
      Alert.alert('ไม่พบพิกัด', 'ลองลากหมุดบนแผนที่เพื่อระบุตำแหน่งเองได้ค่ะ');
      setDisplayName(name);
    }
  };

  // ค้นหาสถานที่นอก list ด้วย Nominatim
  const doSearch = async (query: string) => {
    if (!query.trim()) return;
    setSearching(true);
    setShowLocationDD(false);
    const results = await searchNominatim(query);
    setSearchResults(results);
    setSearching(false);
    // ย้ายหมุดไปผลแรกทันที
    if (results.length > 0) {
      moveTo(parseFloat(results[0].lat), parseFloat(results[0].lon), results[0].display_name);
    }
  };

  const selectSearchResult = (place: any) => {
    setLocationSearch(place.display_name.split(',')[0]);
    moveTo(parseFloat(place.lat), parseFloat(place.lon), place.display_name);
    setSearchResults([]);
  };

  const filteredLocations = locationSearch.trim()
    ? LOCATIONS.filter(l => l.toLowerCase().includes(locationSearch.toLowerCase()))
    : LOCATIONS;

  // ── image pickers ────────────────────────────────────────
  const pickImages = async () => {
    Alert.alert('เพิ่มรูปภาพ', 'เลือกวิธีเพิ่มรูปภาพ', [
      {
        text: 'ถ่ายรูป', onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { alert('กรุณาอนุญาตการเข้าถึงกล้อง'); return; }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
          if (!result.canceled) {
            const converted = await Promise.all(result.assets.map(async a => {
              const m = await ImageManipulator.manipulateAsync(a.uri, [], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
              return m.uri;
            }));
            setImages(prev => [...prev, ...converted]);
          }
        },
      },
      {
        text: 'เลือกจากคลัง', onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { alert('กรุณาอนุญาตการเข้าถึงรูปภาพ'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true, quality: 0.8, selectionLimit: 3,
          });
          if (!result.canceled) {
            const converted = await Promise.all(result.assets.map(async a => {
              const m = await ImageManipulator.manipulateAsync(a.uri, [], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
              return m.uri;
            }));
            setImages(prev => [...prev, ...converted]);
          }
        },
      },
      { text: 'ยกเลิก', style: 'cancel' },
    ]);
  };

  const pickLocationImage = async () => {
    Alert.alert('เพิ่มรูปจุดฝาก', 'เลือกวิธีเพิ่มรูปภาพ', [
      {
        text: 'ถ่ายรูป', onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { alert('กรุณาอนุญาตการเข้าถึงกล้อง'); return; }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
          if (!result.canceled) {
            const m = await ImageManipulator.manipulateAsync(result.assets[0].uri, [], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
            setReceiveLocationImage(m.uri);
          }
        },
      },
      {
        text: 'เลือกจากคลัง', onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { alert('กรุณาอนุญาตการเข้าถึงรูปภาพ'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });
          if (!result.canceled) {
            const m = await ImageManipulator.manipulateAsync(result.assets[0].uri, [], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
            setReceiveLocationImage(m.uri);
          }
        },
      },
      { text: 'ยกเลิก', style: 'cancel' },
    ]);
  };

  // ── submit ───────────────────────────────────────────────
  const handlePost = async () => {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) { Alert.alert('กรุณาเข้าสู่ระบบก่อนโพสต์'); return; }

    let finalCategory = category;
    if (category === 'อื่น ๆ') {
      if (!otherCategory.trim()) { Alert.alert('กรุณาระบุประเภทสิ่งของ'); return; }
      finalCategory = otherCategory.trim();
    } else if (!category) {
      Alert.alert('กรุณาเลือกประเภทสิ่งของ'); return;
    }

    if (!locationSearch.trim()) { Alert.alert('กรุณาระบุสถานที่'); return; }
    if (!confirmed) { Alert.alert('กรุณายืนยันตำแหน่งบนแผนที่ก่อนค่ะ'); return; }

    setUploading(true);
    try {
      const userDoc = await getDoc(doc(getFirestore(app), 'users', user.uid));
      const username = userDoc.data()?.username || userDoc.data()?.email || '-';
      const uploadedImages = await Promise.all(images.map(uploadToCloudinary));
      const uploadedReceiveImg = receiveLocationImageDeleted ? '' : receiveLocationImage ? await uploadToCloudinary(receiveLocationImage) : null;
      const db = getFirestore(app);

      const locationPayload = {
        location: locationSearch,
        locationName: displayName || locationSearch,
        locationDetail,
        latitude: markerCoord.latitude,
        longitude: markerCoord.longitude,
        locationConfirmed: true,
      };

      if (isEdit && postId) {
        const updateData: Record<string, any> = {
          category: finalCategory, detail, date,
          ...locationPayload,
          images: uploadedImages,
          updatedAt: new Date().toISOString(),
        };
        if (isFound) {
          updateData.receiveLocation = receiveLocation;
          updateData.receiveLocationImage = uploadedReceiveImg ?? ''; 
        }
        await setDoc(doc(db, 'posts', postId), updateData, { merge: true });
        Alert.alert('แก้ไขสำเร็จ');
        if (params.from === 'detail') {
          router.replace({ pathname: '/post-detail', params: { postId, type } });
        } else { router.back(); }
      } else {
        const postData: Record<string, any> = {
          type, images: uploadedImages,
          category: finalCategory, detail, date,
          ...locationPayload,
          userId: user.uid, username,
          createdAt: new Date().toISOString(), status: 'waiting',
        };
        if (isFound) {
          postData.receiveLocation = receiveLocation;
          if (uploadedReceiveImg) postData.receiveLocationImage = uploadedReceiveImg;
        }
        const docRef = await addDoc(collection(db, 'posts'), postData);
        await setDoc(docRef, { postId: docRef.id }, { merge: true });
        Alert.alert('บันทึกสำเร็จ', 'โพสต์ของคุณถูกบันทึกแล้ว');
        resetForm();
        router.replace({ pathname: '/(tabs)', params: { fromTab: type === 'found' ? 'found' : 'lost' } });
      }
    } catch (e) {
      console.log('ERROR:', e);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
    } finally { setUploading(false); }
  };

  // ── render ───────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFAF5' }}>
      <LinearGradient colors={['#ffffff', '#ffffff']} style={styles.header}>
        <TouchableOpacity onPress={() => { resetForm(); router.back(); }} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#5A4633" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{label.header}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAwareScrollView
        ref={scrollRef}
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!mapScrollLocked}
        enableOnAndroid={true}
        extraScrollHeight={50}
        keyboardShouldPersistTaps="handled"
      >
        {/* รูปสิ่งของ */}
        <Text style={styles.label}>อัปโหลดรูปสิ่งของ</Text>
        <View style={styles.imageRow}>
          <TouchableOpacity style={styles.imageBox} onPress={pickImages}>
            <Ionicons name="camera-outline" size={28} color="#FBAA58" />
            <Text style={styles.imageBoxText}>เพิ่มรูป</Text>
          </TouchableOpacity>
          {images.map((uri, i) => (
            <View key={i} style={styles.imageBox}>
              <Image source={{ uri }} style={styles.imageFill} />
              <TouchableOpacity style={styles.removeImg}
                onPress={() => setImages(images.filter((_, idx) => idx !== i))}>
                <Ionicons name="close-circle" size={20} color="#F97316" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ประเภทของ */}
        <Text style={styles.label}>{label.category}</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setShowCategoryDD(!showCategoryDD)}>
          <Text style={category ? styles.ddValue : styles.ddPlaceholder}>
            {category || label.categoryPlaceholder}
          </Text>
          <Ionicons name={showCategoryDD ? 'chevron-up' : 'chevron-down'} size={18} color="#FBAA58" />
        </TouchableOpacity>
        {showCategoryDD && (
          <View style={styles.ddList}>
            {CATEGORIES.map(item => (
              <TouchableOpacity key={item} style={styles.ddItem}
                onPress={() => { setCategory(item); setShowCategoryDD(false); }}>
                <Text style={styles.ddItemText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {category === 'อื่น ๆ' && (
          <TextInput style={[styles.input, { marginTop: 8 }]} placeholder={label.categoryOther}
            placeholderTextColor="#bbb" value={otherCategory} onChangeText={setOtherCategory} />
        )}

        {/* รายละเอียด */}
        <Text style={styles.label}>รายละเอียด</Text>
        <TextInput style={[styles.input, styles.textarea]} placeholder={label.detail}
          placeholderTextColor="#bbb" multiline value={detail} onChangeText={setDetail} />

        {/* วันที่ */}
        <Text style={styles.label}>{label.dateLabel}</Text>
        <View style={styles.inputRow}>
          <TextInput style={{ flex: 1, fontSize: 14, color: '#333' }} placeholder="วว/ดด/ปปปป"
            placeholderTextColor="#bbb" value={date} onChangeText={handleDateChange}
            keyboardType="numeric" maxLength={10} />
          <Ionicons name="calendar-outline" size={20} color="#FBAA58" />
        </View>

        {/* ══ สถานที่ ══ */}
        <Text style={styles.label}>{label.locationLabel}</Text>

        {/* ช่องค้นหาช่องเดียว */}
        <View style={styles.inputRow}>
          <Ionicons name="search-outline" size={16} color="#FBAA58" />
          <TextInput
            style={{ flex: 1, fontSize: 14, color: '#333', marginLeft: 8 }}
            placeholder="พิมพ์ชื่ออาคาร หรือสถานที่..."
            placeholderTextColor="#bbb"
            value={locationSearch}
            onFocus={() => setShowLocationDD(true)}
            onChangeText={(text) => {
              setLocationSearch(text);
              setShowLocationDD(true);
              setConfirmed(false);
              setSearchResults([]);
            }}
            onSubmitEditing={() => doSearch(locationSearch)}
            returnKeyType="search"
          />
          {searching
            ? <ActivityIndicator size="small" color="#FBAA58" />
            : locationSearch.length > 0
              ? <TouchableOpacity onPress={() => {
                  setLocationSearch(''); setShowLocationDD(false);
                  setSearchResults([]); setDisplayName(''); setConfirmed(false);
                }}>
                  <Ionicons name="close-circle" size={16} color="#bbb" />
                </TouchableOpacity>
              : null
          }
        </View>

        {/* Dropdown: LOCATIONS + ปุ่มค้นหาบนแผนที่ */}
        {showLocationDD && (
          <View style={styles.ddList}>
            {filteredLocations.map(name => (
              <TouchableOpacity key={name} style={styles.ddItem}
                onPress={() => selectFromList(name)}>
                <Ionicons name="location-outline" size={14} color="#FBAA58" />
                <Text style={[styles.ddItemText, { marginLeft: 8 }]}>{name}</Text>
              </TouchableOpacity>
            ))}

            {/* ปุ่มค้นหาสถานที่นอก list ด้วย Nominatim */}
            {locationSearch.trim().length > 0 && (
              <TouchableOpacity
                style={[styles.ddItem, { backgroundColor: '#FFF4EC' }]}
                onPress={() => doSearch(locationSearch)}
              >
                <Ionicons name="search" size={14} color="#F97316" />
                <Text style={{ fontSize: 14, color: '#F97316', marginLeft: 8 }}>
                  ค้นหา "{locationSearch}" บนแผนที่
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ผลลัพธ์ Nominatim */}
        {searchResults.length > 0 && (
          <View style={styles.searchResultBox}>
            {searchResults.map((place, i) => (
              <TouchableOpacity key={i} style={styles.searchResultItem}
                onPress={() => selectSearchResult(place)}>
                <Ionicons name="location-outline" size={16} color="#FBAA58" />
                <Text style={styles.searchResultText} numberOfLines={2}>{place.display_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ══ แผนที่ (แสดงเสมอ) ══ */}
        <View style={{ height: 260, borderRadius: 12, overflow: 'hidden', marginTop: 10 }}>
          <WebView
            key={mapKey}
            style={{ flex: 1 }}
            onMessage={async (e) => {
              const { lat, lon } = JSON.parse(e.nativeEvent.data);
              setMarkerCoord({ latitude: lat, longitude: lon });
              setConfirmed(false);
              // reverse geocode เมื่อลากหมุด
              const name = await reverseGeocode(lat, lon);
              setDisplayName(name);
            }}
            onTouchStart={() => setMapScrollLocked(true)}
            onTouchEnd={() => setMapScrollLocked(false)}
            onTouchCancel={() => setMapScrollLocked(false)}
            source={{
              html: `
                <!DOCTYPE html><html>
                <head><meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body{margin:0;padding:0;}
                  #map{width:100%;height:100vh;}
                  .drag-hint{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);
                    background:rgba(0,0,0,0.55);color:#fff;font-size:12px;padding:4px 12px;
                    border-radius:20px;z-index:999;white-space:nowrap;}
                </style></head>
                <body>
                  <div id="map"></div>
                  <div class="drag-hint">ลากหมุดเพื่อปรับตำแหน่ง</div>
                  <script>
                    function initMap(){
                      var pos={lat:${markerCoord.latitude},lng:${markerCoord.longitude}};
                      var map=new google.maps.Map(document.getElementById('map'),{
                        center:pos,zoom:17,disableDefaultUI:true,zoomControl:true
                      });
                      var marker=new google.maps.Marker({position:pos,map:map,draggable:true});
                      marker.addListener('dragend',function(){
                        var p=marker.getPosition();
                        window.ReactNativeWebView.postMessage(JSON.stringify({lat:p.lat(),lon:p.lng()}));
                      });
                    }
                  </script>
                  <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&callback=initMap" async defer></script>
                </body></html>
              `
            }}
            javaScriptEnabled domStorageEnabled scrollEnabled={false}
          />
          {/* ปุ่ม GPS: ย้ายหมุดไปตำแหน่งปัจจุบัน */}
          <View style={{ position: 'absolute', right: 10, bottom: 10 }}>
            <TouchableOpacity
              style={{ backgroundColor: '#F97316', padding: 10, borderRadius: 50 }}
              onPress={async () => {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') { alert('กรุณาอนุญาตการเข้าถึงตำแหน่ง'); return; }
                const loc = await Location.getCurrentPositionAsync({});
                const name = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
                moveTo(loc.coords.latitude, loc.coords.longitude, name);
              }}
            >
              <Ionicons name="locate" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ปุ่มยืนยัน (แสดงเมื่อยังไม่ยืนยัน) */}
        {!confirmed && (
          <TouchableOpacity onPress={() => {
            if (!locationSearch.trim()) {
              Alert.alert('กรุณาพิมพ์ชื่อสถานที่ก่อนยืนยันค่ะ');
              return;
            }
            setConfirmed(true);
            setShowLocationDD(false);
            setSearchResults([]);
          }} activeOpacity={0.85}>
            <LinearGradient colors={['#FFBB6B', '#F97316']} style={styles.confirmBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.confirmBtnText}>ยืนยันจุดนี้</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* รายละเอียดสถานที่ */}
        <Text style={styles.label}>รายละเอียดสถานที่</Text>
        <TextInput style={[styles.input, styles.textarea]}
          placeholder="เช่น ชั้น 2 ห้อง B201..." placeholderTextColor="#bbb"
          multiline value={locationDetail} onChangeText={setLocationDetail} />

        {/* found only */}
          {isFound && (
            <>
              <Text style={styles.label}>สถานที่รับของคืน</Text>
              <TextInput style={[styles.input, styles.textarea]}
                placeholder="ระบุสถานที่ที่สามารถรับของคืนได้..."
                placeholderTextColor="#bbb" multiline value={receiveLocation} onChangeText={setReceiveLocation} />

              <Text style={styles.label}>
                อัปโหลดรูปจุดฝาก <Text style={styles.optional}>(แนะนำ)</Text>
              </Text>

              <View style={styles.imageRow}>
                {/* ปุ่มเพิ่มรูป */}
                <TouchableOpacity style={styles.imageBox} onPress={pickLocationImage}>
                  <Ionicons name="camera-outline" size={28} color="#FBAA58" />
                  <Text style={styles.imageBoxText}>ถ่ายรูป</Text>
                </TouchableOpacity>

                {/* รูปที่เลือก + ปุ่มลบ */}
                {receiveLocationImage && (
                  <View style={styles.imageBox}>
                    <Image source={{ uri: receiveLocationImage }} style={styles.imageFill} />
                    <TouchableOpacity
                      style={styles.removeImg}
                      onPress={() => {
                        setReceiveLocationImage(null);
                        setReceiveLocationImageDeleted(true);  // ← เพิ่ม
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color="#F97316" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}

        {/* ปุ่มโพสต์ */}
        <TouchableOpacity activeOpacity={0.85} style={{ marginTop: 28 }} onPress={handlePost} disabled={uploading}>
          <View style={styles.btnPost}>
            <Text style={styles.btnPostText}>
              {uploading ? 'กำลังอัปโหลด...' : isEdit ? 'บันทึกการแก้ไข' : 'โพสต์'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnDraft} onPress={() => { resetForm(); router.back(); }}>
          <Text style={styles.btnDraftText}>ยกเลิก</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 55, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#E0D6CC',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#5A4633' },
  form: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: '#5A4633', marginTop: 16, marginBottom: 6 },
  optional: { fontWeight: '400', color: '#bbb' },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  imageBox: {
    width: 100, height: 100, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#FBAA58', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F3',
  },
  imageBoxText: { fontSize: 11, color: '#FBAA58', marginTop: 4 },
  imageFill: { width: '100%', height: '100%', borderRadius: 12 },
  removeImg: { position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 10 },
  input: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#F0E6DA',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#333',
  },
  textarea: { height: 90, textAlignVertical: 'top' },
  inputRow: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#F0E6DA',
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center',
  },
  dropdown: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#F0E6DA',
    paddingHorizontal: 14, paddingVertical: 13,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  ddPlaceholder: { color: '#bbb', fontSize: 14 },
  ddValue: { color: '#333', fontSize: 14 },
  ddList: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#F0E6DA',
    marginTop: 4, overflow: 'hidden',
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
  },
  ddItem: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#FFF0E6',
    flexDirection: 'row', alignItems: 'center',
  },
  ddItemText: { fontSize: 14, color: '#5A4633' },
  searchResultBox: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#F0E6DA',
    marginTop: 4, overflow: 'hidden', elevation: 4,
  },
  searchResultItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#FFF0E6', gap: 8,
  },
  searchResultText: { flex: 1, fontSize: 13, color: '#5A4633' },
  mapPlaceName: {
    fontSize: 12, color: '#777', marginTop: 6,
    paddingHorizontal: 4, lineHeight: 18,
  },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 12, paddingVertical: 12, marginTop: 10,
  },
  confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  confirmedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10,
    marginTop: 8, borderWidth: 1, borderColor: '#bbf7d0',
  },
  confirmedText: { fontSize: 12, color: '#16a34a', flex: 1 },
  reSelectText: { fontSize: 12, color: '#F97316', fontWeight: '600' },
  btnPost: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', backgroundColor: '#F97316' },
  btnPostText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDraft: {
    marginTop: 10, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#FBAA58',
  },
  btnDraftText: { color: '#FBAA58', fontSize: 16, fontWeight: '600' },
});
