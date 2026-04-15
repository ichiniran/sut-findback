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
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { app } from '../constants/firebase';


const LOCATIONS = [
  'อาคารเรียนรวม 1', 'อาคารเรียนรวม 2', 'อาคารเรียนรวม 3',
  'อาคารรัฐสีมาคุณากร', 'หอพักนักศึกษา', 'โรงอาหาร', 'อื่น ๆ',
];
const CATEGORIES = [
  'กระเป๋า / กระเป๋าสตางค์', 'บัตรนักศึกษา / บัตรประชาชน',
  'โทรศัพท์ / อุปกรณ์อิเล็กทรอนิกส์', 'เงิน', 'กุญแจ',
  'เครื่องประดับ', 'เสื้อผ้า', 'อื่น ๆ',
];

const todayFormatted = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear() + 543;
  return `${day}/${month}/${year}`;
};

    const uploadToCloudinary = async (localUri: string): Promise<string> => {
      if (localUri.startsWith('http')) return localUri;

      const formData = new FormData();

      // 🔥 บังคับเป็น JPG ไปเลย ไม่ต้องสน ext เดิม
      formData.append('file', {
        uri: localUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);

      formData.append('upload_preset', 'nxbvgcct');
      formData.append('cloud_name', 'dto2v8z6t');

      const res = await fetch(
        'https://api.cloudinary.com/v1_1/dto2v8z6t/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await res.json();

      // 🔥 debug เผื่อมี error
      if (!data.secure_url) {
        console.log('Cloudinary error:', data);
        throw new Error('Upload failed');
      }

      return data.secure_url;
    };

export default function PostForm() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // type: 'found' | 'lost'
  const type = (params.type as string) === 'lost' ? 'lost' : 'found';
  const isFound = type === 'found';

  // edit mode
  const isEdit = params.mode === 'edit';
  const postId = params.postId as string;

  // form state
  const [images, setImages] = useState<string[]>([]);
  const [receiveLocationImage, setReceiveLocationImage] = useState<string | null>(null); // found only
  const [category, setCategory] = useState('');
  const [showCategoryDD, setShowCategoryDD] = useState(false);
  const [otherCategory, setOtherCategory] = useState('');
  const [detail, setDetail] = useState('');
  const [location, setLocation] = useState('');
  const [showLocationDD, setShowLocationDD] = useState(false);
  const [locationDetail, setLocationDetail] = useState('');
  const [receiveLocation, setReceiveLocation] = useState(''); // found only
  const [mapSearch, setMapSearch] = useState(''); // สิ่งที่ user พิมพ์
  const [selectedPlaceName, setSelectedPlaceName] = useState(''); // ผลลัพธ์ที่เลือกจากการค้นหา
  const [date, setDate] = useState<string>(todayFormatted());
  const [markerCoord, setMarkerCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [uploading, setUploading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const [mapScrollLocked, setMapScrollLocked] = useState(false);
  const searchTimeout = useRef<any>(null);

  // ── labels ──────────────────────────────────────────────
  const label = {
    header: isFound ? 'แจ้งพบของ' : 'แจ้งของหาย',
    category: isFound ? 'ประเภทของที่พบ' : 'ประเภทของที่หาย',
    categoryPlaceholder: isFound ? 'เลือกประเภทสิ่งของที่พบ' : 'เลือกประเภทสิ่งของที่หาย',
    categoryOther: isFound ? 'โปรดระบุประเภทสิ่งของที่พบ' : 'โปรดระบุประเภทสิ่งของที่หาย',
    detail: isFound ? 'อธิบายลักษณะของที่พบ...' : 'อธิบายลักษณะของที่หาย...',
    dateLabel: isFound ? 'วันที่พบ' : 'วันที่หาย',
    locationLabel: isFound ? 'สถานที่พบ' : 'สถานที่หาย',
  };

  // ── reset ────────────────────────────────────────────────
  const resetForm = () => {
    setImages([]);
    setReceiveLocationImage(null);
    setCategory('');
    setOtherCategory('');
    setDetail('');
    setLocation('');
    setShowCategoryDD(false);
    setShowLocationDD(false);
    setLocationDetail('');
    setReceiveLocation('');
    setMapSearch('');
    setDate(todayFormatted());
    setMarkerCoord(null);
    setSearchResults([]);
    setConfirmed(false);
  };

  // ── populate edit mode ───────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    if (isEdit) {
      setCategory(params.category as string || '');
      setDetail(params.detail as string || '');
      setLocation(params.location as string || '');
      setLocationDetail(params.locationDetail as string || '');
      setReceiveLocation(params.receiveLocation as string || '');
      setDate(params.date as string || todayFormatted());
      setMapSearch(params.locationName as string || '');
      if (params.latitude && params.longitude) {
        setMarkerCoord({
          latitude: parseFloat(params.latitude as string),
          longitude: parseFloat(params.longitude as string),
        });
        setConfirmed(true);
      }
      if (params.images) {
        try { setImages(JSON.parse(params.images as string)); }
        catch { setImages([params.images as string]); }
      }
      if (params.receiveLocationImage) setReceiveLocationImage(params.receiveLocationImage as string);
    } else {
      resetForm();
    }
  }, [isEdit, type]);

  useEffect(() => {
  if (location === 'อื่น ๆ') {
    (async () => {
      const coords = await getUserLocation();
      if (coords) {
        setMarkerCoord({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });

        // 🔥 set mapSearch เป็นตำแหน่งปัจจุบันเลย
        reverseGeocode(coords.latitude, coords.longitude);
      }
    })();
  }
}, [location]);
  //Reverse Geocoding 
  const formatShortAddress = (addr: any) => {
  if (!addr) return '';

  const name =
    addr.road ||
    addr.amenity ||
    addr.building ||
    addr.neighbourhood ||
    addr.suburb ||
    addr.city ||
    '';

  const province = addr.state || '';

  return name && province ? `${name}, ${province}` : name || province || '';
};

const reverseGeocode = async (lat: number, lon: number) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'th' },
    });
    const data = await res.json();

    const short = formatShortAddress(data.address);

    // ไม่ overwrite ถ้าผู้ใช้พิมพ์เอง
    setSelectedPlaceName(short);

  } catch (e) {
    console.log('reverse geocode error:', e);
  }
};
  // ── date format ──────────────────────────────────────────
  const handleDateChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length >= 3 && digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else if (digits.length >= 5) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
    setDate(formatted);
  };

  // ── location / map ───────────────────────────────────────
  const getUserLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { alert('กรุณาอนุญาตการเข้าถึงตำแหน่ง'); return null; }
    const loc = await Location.getCurrentPositionAsync({});
    return loc.coords;
  };

    const searchPlace = async (query?: string) => {
  const raw = (query ?? mapSearch).trim();
  if (!raw) return;

  setConfirmed(false);

    try {
        // ค้นหาปกติก
        let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(raw)}&format=json&limit=5`;

        let res = await fetch(url, {
        headers: { 'Accept-Language': 'th', 'User-Agent': 'SUT-FindBack-App' },
        });

        let data = await res.json();

        // ถ้าไม่เจอ 
        if (data.length === 0) {
        const fallback = raw + " ตำบล สุรนารี";

        url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fallback)}&format=json&limit=5`;

        res = await fetch(url, {
            headers: { 'Accept-Language': 'th', 'User-Agent': 'SUT-FindBack-App' },
        });

        data = await res.json();
        }

        setSearchResults(data);

    } catch (e) {
        console.log('search error:', e);
    }
    };

    const selectPlace = (place: any) => {
    setMarkerCoord({
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
    });

    setSelectedPlaceName(place.display_name); //  เก็บแยก
    setSearchResults([]);
    setConfirmed(false);
    };

  const handleConfirmLocation = () => {
    setConfirmed(true);
    Alert.alert('✅ ยืนยันจุดแล้ว', `📍 ${markerCoord?.latitude.toFixed(5)}, ${markerCoord?.longitude.toFixed(5)}`);
  };

  // ── image pickers ────────────────────────────────────────
  const pickImages = async () => {
    Alert.alert('เพิ่มรูปภาพ', 'เลือกวิธีเพิ่มรูปภาพ', [
      {
        text: 'ถ่ายรูป',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { alert('กรุณาอนุญาตการเข้าถึงกล้อง'); return; }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
          if (!result.canceled) {
          const converted = await Promise.all(
            result.assets.map(async (asset) => {
              const manipulated = await ImageManipulator.manipulateAsync(
                asset.uri,
                [],
                {
                  compress: 0.8,
                  format: ImageManipulator.SaveFormat.JPEG,
                }
              );
              return manipulated.uri;
            })
          );

          setImages(prev => [...prev, ...converted]);
        }
        },
      },
      {
        text: 'เลือกจากคลัง',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { alert('กรุณาอนุญาตการเข้าถึงรูปภาพ'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
            selectionLimit: 3,
          });
          if (!result.canceled) {
          const convertedImages = await Promise.all(
            result.assets.map(async (asset) => {
              const manipulated = await ImageManipulator.manipulateAsync(
                asset.uri,
                [],
                {
                  compress: 0.8,
                  format: ImageManipulator.SaveFormat.JPEG,
                }
              );
              return manipulated.uri;
            })
          );

          setImages(prev => [...prev, ...convertedImages]);
        }
        },
      },
      { text: 'ยกเลิก', style: 'cancel' },
    ]);
  };

  const pickLocationImage = async () => {
    Alert.alert('เพิ่มรูปจุดฝาก', 'เลือกวิธีเพิ่มรูปภาพ', [
      {
        text: 'ถ่ายรูป',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { alert('กรุณาอนุญาตการเข้าถึงกล้อง'); return; }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
          if (!result.canceled) {
          const manipulated = await ImageManipulator.manipulateAsync(
            result.assets[0].uri,
            [],
            {
              compress: 0.8,
              format: ImageManipulator.SaveFormat.JPEG,
            }
          );

          setReceiveLocationImage(manipulated.uri);
        }
        },
      },
      {
        text: 'เลือกจากคลัง',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { alert('กรุณาอนุญาตการเข้าถึงรูปภาพ'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });
          if (!result.canceled) {
          const manipulated = await ImageManipulator.manipulateAsync(
            result.assets[0].uri,
            [],
            {
              compress: 0.8,
              format: ImageManipulator.SaveFormat.JPEG,
            }
          );

  setReceiveLocationImage(manipulated.uri);
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

    // validate category
    let finalCategory = category;
    if (category === 'อื่น ๆ') {
      if (!otherCategory.trim()) { Alert.alert('กรุณาระบุประเภทสิ่งของ'); return; }
      finalCategory = otherCategory.trim();
    } else if (!category) {
      Alert.alert('กรุณาเลือกประเภทสิ่งของ'); return;
    }

    // validate location
    let finalLocation = location;
    let finalLocationName = location;
    let finalLat: number | undefined;
    let finalLon: number | undefined;
    if (location === 'อื่น ๆ') {
      if (!markerCoord || !confirmed) {
        Alert.alert('กรุณายืนยันตำแหน่งบนแผนที่');
        return;
        }
      finalLocationName = selectedPlaceName || mapSearch;
      finalLat = markerCoord.latitude;
      finalLon = markerCoord.longitude;
    } else if (!location) {
      Alert.alert('กรุณาเลือกสถานที่'); return;
    }

    setUploading(true);
    try {
      // denormalize username — 1 fetch ตอน post เท่านั้น
      const userDoc = await getDoc(doc(getFirestore(app), 'users', user.uid));
      const username = userDoc.data()?.username || userDoc.data()?.email || '-';

      const uploadedImages = await Promise.all(images.map(uploadToCloudinary));
      const uploadedreceiveLocationImage = receiveLocationImage ? await uploadToCloudinary(receiveLocationImage) : null;

      const db = getFirestore(app);

      if (isEdit && postId) {
        // ── EDIT ──
        const updateData: Record<string, any> = {
          category: finalCategory,
          detail,
          location: finalLocation,
          locationName: finalLocationName,
          locationDetail,
          date,
          images: uploadedImages,
          updatedAt: new Date().toISOString(),
          ...(finalLat !== undefined ? { latitude: finalLat, longitude: finalLon, locationConfirmed: confirmed } : {}),
        };
        if (isFound) {
          updateData.receiveLocation = receiveLocation;
          if (uploadedreceiveLocationImage) updateData.receiveLocationImage = uploadedreceiveLocationImage;
        }
        await setDoc(doc(db, 'posts', postId), updateData, { merge: true });
       Alert.alert('แก้ไขสำเร็จ');

if (params.from === 'detail') {
  router.replace({
    pathname: '/post-detail',
    params: {
      postId: postId,
      type: type,
    },
  });
} else {
  router.back();
}
      } else {
        // ── CREATE ──
        const postData: Record<string, any> = {
          type,
          images: uploadedImages,
          category: finalCategory,
          detail,
          date,
          location: finalLocation,
          locationName: finalLocationName,
          locationDetail,
          ...(finalLat !== undefined ? { latitude: finalLat, longitude: finalLon, locationConfirmed: confirmed } : {}),
          userId: user.uid,
          username,
          createdAt: new Date().toISOString(),
          status: 'waiting',
        };
        if (isFound) {
          postData.receiveLocation = receiveLocation;
          if (uploadedreceiveLocationImage) postData.receiveLocationImage = uploadedreceiveLocationImage;
        }

        // flat collection 
        const docRef = await addDoc(collection(db, 'posts'), postData);
        await setDoc(docRef, { postId: docRef.id }, { merge: true });

        Alert.alert('บันทึกสำเร็จ', 'โพสต์ของคุณถูกบันทึกแล้ว');
        resetForm();
        router.replace({
        pathname: '/(tabs)',
        params: {
          fromTab: type === 'found' ? 'found' : 'lost'
        }
      });
      }
    } catch (e) {
      console.log('ERROR:', e);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setUploading(false);
    }
  };

  // ── render ───────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFAF5' }}>
      <LinearGradient colors={['#FFBB6B', '#F97316']} style={styles.header}>
        <TouchableOpacity
          onPress={() => { resetForm(); router.back();}}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{label.header}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!mapScrollLocked}
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
              <TouchableOpacity
                style={styles.removeImg}
                onPress={() => setImages(images.filter((_, idx) => idx !== i))}
              >
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
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            placeholder={label.categoryOther}
            placeholderTextColor="#bbb"
            value={otherCategory}
            onChangeText={setOtherCategory}
          />
        )}

        {/* รายละเอียด */}
        <Text style={styles.label}>รายละเอียด</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder={label.detail}
          placeholderTextColor="#bbb"
          multiline value={detail} onChangeText={setDetail}
        />

        {/* วันที่ */}
        <Text style={styles.label}>{label.dateLabel}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={{ flex: 1, fontSize: 14, color: '#333' }}
            placeholder="วว/ดด/ปปปป"
            placeholderTextColor="#bbb"
            value={date}
            onChangeText={handleDateChange}
            keyboardType="numeric"
            maxLength={10}
          />
          <Ionicons name="calendar-outline" size={20} color="#FBAA58" />
        </View>

        {/* สถานที่ */}
        <Text style={styles.label}>{label.locationLabel}</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setShowLocationDD(!showLocationDD)}>
          <Text style={location ? styles.ddValue : styles.ddPlaceholder}>
            {location || 'เลือกสถานที่'}
          </Text>
          <Ionicons name={showLocationDD ? 'chevron-up' : 'chevron-down'} size={18} color="#FBAA58" />
        </TouchableOpacity>
        {showLocationDD && (
          <View style={styles.ddList}>
            {LOCATIONS.map(item => (
              <TouchableOpacity key={item} style={styles.ddItem}
                onPress={() => { setLocation(item); setShowLocationDD(false); }}>
                <Text style={styles.ddItemText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* แผนที่ (อื่น ๆ) */}
        {location === 'อื่น ๆ' && (
          <>
            <Text style={styles.label}>พิมพ์ชื่อสถานที่</Text>
            <View style={styles.inputRow}>
              <TextInput style={{ flex: 1, fontSize: 14, color: '#333' }}
                    placeholder="พิมพ์ชื่อสถานที่"
                    placeholderTextColor="#bbb"
                    value={mapSearch}
                    onChangeText={(text) => {
                    setSelectedPlaceName(text); 
                    setMapSearch(text);
                    setConfirmed(false);

                    // auto search (debounce)
                    if (searchTimeout.current) {
                            clearTimeout(searchTimeout.current);
                        }

                    searchTimeout.current = setTimeout(() => {
                         searchPlace(text);
                        }, 500);
                        }}
                    />
            </View>
                <TouchableOpacity
                    onPress={() => searchPlace(mapSearch)}
                    style={{
                        marginTop: 10,
                        backgroundColor: '#F97316',
                        paddingVertical: 12,
                        borderRadius: 12,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 6
                    }}
                    >
                    <Ionicons name="search" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '600' }}>
                        ค้นหาสถานที่
                    </Text>
                    </TouchableOpacity>
            {searchResults.length > 0 && (
              <View style={styles.searchResultBox}>
                {searchResults.map((place, i) => (
                  <TouchableOpacity key={i} style={styles.searchResultItem} onPress={() => selectPlace(place)}>
                    <Ionicons name="location-outline" size={16} color="#FBAA58" />
                    <Text style={styles.searchResultText} numberOfLines={2}>{place.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {markerCoord && (
              <View style={{ height: 260, borderRadius: 12, overflow: 'hidden', marginTop: 10 }}>
                <WebView
                  style={{ flex: 1 }}
                  onMessage={(e) => {
                    const { lat, lon } = JSON.parse(e.nativeEvent.data);
                    setMarkerCoord({ latitude: lat, longitude: lon });
                    setConfirmed(false);
                    reverseGeocode(lat, lon); //อัปเดตชื่อสถานที่เมื่อหมุดถูกย้าย
                  }}
                  onTouchStart={() => setMapScrollLocked(true)}
                  onTouchEnd={() => setMapScrollLocked(false)}
                  onTouchCancel={() => setMapScrollLocked(false)}
                  source={{
                    html: `
                      <!DOCTYPE html><html>
                      <head><meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <style>body{margin:0;padding:0;}#map{width:100%;height:100vh;}
                      .drag-hint{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);
                      background:rgba(0,0,0,0.55);color:#fff;font-size:12px;padding:4px 12px;
                      border-radius:20px;z-index:999;white-space:nowrap;}</style></head>
                      <body><div id="map"></div><div class="drag-hint">ลากหมุดเพื่อปรับตำแหน่ง</div>
                      <script>
                        function initMap(){
                          var pos={lat:${markerCoord.latitude},lng:${markerCoord.longitude}};
                          var map=new google.maps.Map(document.getElementById('map'),{center:pos,zoom:17,disableDefaultUI:true,zoomControl:true});
                          var marker=new google.maps.Marker({position:pos,map:map,draggable:true});
                          marker.addListener('dragend',function(){
                            var p=marker.getPosition();
                            window.ReactNativeWebView.postMessage(JSON.stringify({lat:p.lat(),lon:p.lng()}));
                          });
                        }
                      </script>
                      <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBQTaITdWwgKSrlTHPunVf5saxtVQdLpCE&callback=initMap" async defer></script>
                      </body></html>
                    `
                  }}
                  javaScriptEnabled domStorageEnabled scrollEnabled={false}
                />
                <View style={{ position: 'absolute', right: 10, bottom: 10 }}>
                <TouchableOpacity
                    style={{
                    backgroundColor: '#F97316',
                    padding: 10,
                    borderRadius: 50,
                    }}
                    onPress={async () => {
                    const coords = await getUserLocation();
                    if (coords) {
                        setMarkerCoord(coords);
                        reverseGeocode(coords.latitude, coords.longitude);
                    }
                    }}
                >
                    <Ionicons name="locate" size={18} color="#fff" />
                </TouchableOpacity>
                </View>

              </View>
            )}

            {markerCoord && !confirmed && (
              <TouchableOpacity onPress={handleConfirmLocation} activeOpacity={0.85}>
                <LinearGradient colors={['#FFBB6B', '#F97316']} style={styles.confirmBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.confirmBtnText}>ยืนยันจุดนี้</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {confirmed && (
              <View style={styles.confirmedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                <Text style={styles.confirmedText}>
                  ยืนยันจุดแล้ว · {markerCoord?.latitude.toFixed(5)}, {markerCoord?.longitude.toFixed(5)}
                </Text>
                <TouchableOpacity onPress={() => setConfirmed(false)}>
                  <Text style={styles.reSelectText}>เปลี่ยน</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* รายละเอียดสถานที่ */}
        <Text style={styles.label}>รายละเอียดสถานที่</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="เช่น ชั้น 2 ห้อง B201..."
          placeholderTextColor="#bbb"
          multiline value={locationDetail} onChangeText={setLocationDetail}
        />

        {/* found only: สถานที่รับของคืน + รูปจุดฝาก */}
        {isFound && (
          <>
            <Text style={styles.label}>สถานที่รับของคืน</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="ระบุสถานที่ที่สามารถรับของคืนได้..."
              placeholderTextColor="#bbb"
              multiline value={receiveLocation} onChangeText={setReceiveLocation}
            />

            <Text style={styles.label}>
              อัปโหลดรูปจุดฝาก <Text style={styles.optional}>(แนะนำ)</Text>
            </Text>
            <TouchableOpacity style={styles.imageBox} onPress={pickLocationImage}>
              {receiveLocationImage
                ? <Image source={{ uri: receiveLocationImage }} style={styles.imageFill} />
                : <>
                    <Ionicons name="camera-outline" size={28} color="#FBAA58" />
                    <Text style={styles.imageBoxText}>ถ่ายรูป</Text>
                  </>
              }
            </TouchableOpacity>
          </>
        )}

        {/* ปุ่มโพสต์ */}
        <TouchableOpacity activeOpacity={0.85} style={{ marginTop: 28 }} onPress={handlePost} disabled={uploading}>
          <LinearGradient colors={['#FFBB6B', '#F97316']} style={styles.btnPost}>
            <Text style={styles.btnPostText}>
              {uploading ? 'กำลังอัปโหลด...' : isEdit ? 'บันทึกการแก้ไข' : 'โพสต์'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnDraft} onPress={() => { resetForm();  router.back(); }}>
          <Text style={styles.btnDraftText}>ยกเลิก</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 55, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
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
  ddItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#FFF0E6' },
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
  btnPost: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  btnPostText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDraft: {
    marginTop: 10, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#FBAA58',
  },
  btnDraftText: { color: '#FBAA58', fontSize: 16, fontWeight: '600' },
});