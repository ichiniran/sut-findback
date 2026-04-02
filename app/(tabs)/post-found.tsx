import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, getFirestore, setDoc } from 'firebase/firestore';
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
import { app } from '../../constants/firebase';

const LOCATIONS = [
  'อาคารเรียนรวม 1', 'อาคารเรียนรวม 2', 'อาคารเรียนรวม 3',
  'อาคารรัฐสีมาคุณากร', 'หอพักนักศึกษา', 'โรงอาหาร', 'อื่น ๆ',
];
const CATEGORIES = [
  'กระเป๋า / กระเป๋าสตางค์', 'บัตรนักศึกษา / บัตรประชาชน',
  'โทรศัพท์ / อุปกรณ์อิเล็กทรอนิกส์', 'เงิน', 'กุญแจ',
  'เครื่องประดับ', 'เสื้อผ้า', 'อื่น ๆ',
];

// วันนี้ในรูปแบบ วว/ดด/ปปปป (พ.ศ.)
const todayFormatted = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear() + 543;
  return `${day}/${month}/${year}`;
};

export default function PostFoundScreen() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [locationImage, setLocationImage] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [showCategoryDD, setShowCategoryDD] = useState(false);
  const [otherCategory, setOtherCategory] = useState('');
  const [detail, setDetail] = useState('');
  const [location, setLocation] = useState('');
  const [showLocationDD, setShowLocationDD] = useState(false);
  const [otherLocation, setOtherLocation] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [receiveLocation, setReceiveLocation] = useState('');
  const [mapSearch, setMapSearch] = useState('');
  const [date, setDate] = useState<string>(todayFormatted());
  const [markerCoord, setMarkerCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const params = useLocalSearchParams();
  const isEdit = params.mode === 'edit';
  const postId = params.postId as string;
  const ownerId = params.userId as string;
  const scrollRef = useRef<ScrollView>(null);
  const [mapScrollLocked, setMapScrollLocked] = useState(false);
  const searchTimeout = useRef<any>(null);
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
      } else if (params.imageUri) {
        setImages([params.imageUri as string]);
      }
      if (params.locationImage) {
        setLocationImage(params.locationImage as string);
      }
    }else {
       setImages([]);
        setLocationImage(null);
        setCategory('');
        setOtherCategory('');
        setDetail('');
        setLocation('');
        setLocationDetail('');
        setReceiveLocation('');
        setMapSearch('');
        setDate(todayFormatted());
        setMarkerCoord(null);
        setSearchResults([]);
        setConfirmed(false);
    }
    
  }, [isEdit]);
  // Auto-format วันที่ (เติม / อัตโนมัติ)
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

  // ดึง location เครื่อง
  const getUserLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { alert('กรุณาอนุญาตการเข้าถึงตำแหน่ง'); return null; }
    const loc = await Location.getCurrentPositionAsync({});
    return loc.coords;
  };

  // ค้นหาสถานที่ด้วย Nominatim
  const searchPlace = async (query?: string) => {
  const q = query ?? mapSearch;
  if (!q.trim()) return;
  setConfirmed(false);
  const coords = await getUserLocation();
  const lat = coords?.latitude ?? 14.8800;
  const lon = coords?.longitude ?? 102.0200;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&viewbox=${lon - 0.1},${lat + 0.1},${lon + 0.1},${lat - 0.1}&bounded=0`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'th', 'User-Agent': 'SUT-FindBack-App' },
  });
  const data = await res.json();
  setSearchResults(data);
};

  // เลือกผลลัพธ์การค้นหา
  const selectPlace = (place: any) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    setMarkerCoord({ latitude: lat, longitude: lon });
    setMapSearch(place.display_name);
    setSearchResults([]);
    setConfirmed(false);
  };

  // ยืนยันจุด
  const handleConfirmLocation = () => {
    setConfirmed(true);
    Alert.alert('✅ ยืนยันจุดแล้ว', `📍 ${markerCoord?.latitude.toFixed(5)}, ${markerCoord?.longitude.toFixed(5)}`);
  };

  const pickImages = async () => {
    Alert.alert('เพิ่มรูปภาพ', 'เลือกวิธีเพิ่มรูปภาพ', [
      {
        text: 'ถ่ายรูป',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { alert('กรุณาอนุญาตการเข้าถึงกล้อง'); return; }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.5 });
          if (!result.canceled) setImages(prev => [...prev, result.assets[0].uri]);
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
          if (!result.canceled) setImages(prev => [...prev, ...result.assets.map(a => a.uri)]);
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
          if (!result.canceled) setLocationImage(result.assets[0].uri);
        },
      },
      {
        text: 'เลือกจากคลัง',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { alert('กรุณาอนุญาตการเข้าถึงรูปภาพ'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });
          if (!result.canceled) setLocationImage(result.assets[0].uri);
        },
      },
      { text: 'ยกเลิก', style: 'cancel' },
    ]);
  };

  const handlePost = async () => {
          // EDIT MODE
       if (isEdit) {
            try {
              const auth = getAuth(app);
              const user = auth.currentUser;

              if (!user || !postId) {
                Alert.alert('ไม่พบข้อมูลโพสต์');
                return;
              }

              setUploading(true);
              const db = getFirestore(app);

              //  upload รูป
              const uploadToCloudinary = async (localUri: string): Promise<string> => {
                if (localUri.startsWith('http')) return localUri;

                const formData = new FormData();
                const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
                const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

                formData.append('file', {
                  uri: localUri,
                  type: mimeType,
                  name: `photo.${ext}`,
                } as any);

                formData.append('upload_preset', 'nxbvgcct');
                formData.append('cloud_name', 'dto2v8z6t');

                const res = await fetch(
                  'https://api.cloudinary.com/v1_1/dto2v8z6t/image/upload',
                  { method: 'POST', body: formData }
                );

                const data = await res.json();
                return data.secure_url;
              };

              const uploadedImages = await Promise.all(images.map(uploadToCloudinary));
              const uploadedLocationImage = locationImage
                ? await uploadToCloudinary(locationImage)
                : null;

              const updateData: any = {
                category,
                detail,
                location,
                locationDetail,
                receiveLocation,
                date,
                images: uploadedImages,
                updatedAt: new Date().toISOString(),
              };

              if (uploadedLocationImage) {
                updateData.locationImage = uploadedLocationImage;
              }

              //  ใช้ setDoc + merge (กัน error 100%)
              const { setDoc, doc } = await import('firebase/firestore');

              await setDoc(
                doc(db, 'users', user.uid, 'found_posts', postId),
                updateData,
                { merge: true }
              );

              Alert.alert('แก้ไขสำเร็จ');
              router.push('/(tabs)');

            } catch (e) {
              console.log(e);
              Alert.alert('แก้ไขไม่สำเร็จ');
            } finally {
              setUploading(false);
            }

            return;
          }
  // ตรวจสอบประเภทสิ่งของ
  let finalCategory = category;
  if (category === 'อื่น ๆ') {
    if (!otherCategory.trim()) {
      Alert.alert('กรุณาระบุประเภทสิ่งของที่พบ');
      return;
    }
    finalCategory = otherCategory.trim();
  } else if (!category) {
    Alert.alert('กรุณาเลือกประเภทสิ่งของที่พบ');
    return;
  }

  // ตรวจสอบสถานที่พบ
  let finalLocation = location;
  let finalLocationName = mapSearch;
  let finalLat = markerCoord?.latitude;
  let finalLon = markerCoord?.longitude;
  let finalConfirmed = confirmed;
  if (location === 'อื่น ๆ') {
    if (!mapSearch.trim() || !markerCoord) {
      Alert.alert('กรุณาระบุและยืนยันจุดสถานที่อื่น ๆ');
      return;
    }
    finalLocation = 'อื่น ๆ';
    finalLocationName = mapSearch;
    finalLat = markerCoord.latitude;
    finalLon = markerCoord.longitude;
    finalConfirmed = confirmed;
  } else {
    finalLocationName = location;
    finalLat = undefined;
    finalLon = undefined;
  }

  // ✅ ดึง user ก่อน (จุดที่หายไป)
  const auth = getAuth(app);
  const user = auth.currentUser;
  if (!user) {
    Alert.alert('กรุณาเข้าสู่ระบบก่อนโพสต์');
    return;
  }
  setUploading(true);
  try {
    const uploadToCloudinary = async (localUri: string): Promise<string> => {
      const formData = new FormData();
      const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : ext === 'heic' ? 'image/heic' : 'image/jpeg';
      formData.append('file', { uri: localUri, type: mimeType, name: `photo.${ext}` } as any);
      formData.append('upload_preset', 'nxbvgcct');
      formData.append('cloud_name', 'dto2v8z6t');
      const res = await fetch('https://api.cloudinary.com/v1_1/dto2v8z6t/image/upload', {
        method: 'POST', body: formData,
      });
      const data = await res.json();
      return data.secure_url;
    };

    const uploadedImages = await Promise.all(images.map(uri => uploadToCloudinary(uri)));
    const uploadedLocationImage = locationImage ? await uploadToCloudinary(locationImage) : null;

    const postData = {
      images: uploadedImages,
      category: finalCategory,
      detail,
      date,
      location: finalLocation,
      locationDetail,
      locationName: finalLocationName,
      ...(finalLat !== undefined ? { latitude: finalLat } : {}),
      ...(finalLon !== undefined ? { longitude: finalLon } : {}),
      ...(finalConfirmed !== undefined ? { locationConfirmed: finalConfirmed } : {}),
      receiveLocation,
      ...(uploadedLocationImage ? { locationImage: uploadedLocationImage } : {}),
      createdAt: new Date().toISOString(),
      userId: user.uid,
      type: 'found',
      status: 'waiting',
    };

    const db = getFirestore(app);
    const docRef = await addDoc(collection(db, 'users', user.uid, 'found_posts'), postData);
    await setDoc(docRef, { postId: docRef.id }, { merge: true });

    Alert.alert('บันทึกสำเร็จ', 'โพสต์ของคุณถูกบันทึกแล้ว');


    setImages([]);
    setLocationImage(null);
    setCategory('');
    setOtherCategory('');
    setDetail('');
    setLocation('');
    setShowCategoryDD(false);
    setShowLocationDD(false);
    setOtherLocation('');
    setLocationDetail('');
    setReceiveLocation('');
    setMapSearch('');
    setDate(todayFormatted());
    setMarkerCoord(null);
    setSearchResults([]);
    setConfirmed(false);

    router.replace('/(tabs)');
  } catch (e) {
    console.log('ERROR:', e);
    Alert.alert('เกิดข้อผิดพลาดในการบันทึกโพสต์', 'ไม่สามารถบันทึกข้อมูลได้');
  }finally {
    setUploading(false); // ✅ จบ loading ทั้ง success และ error
  }
};
const resetForm = () => {
  setImages([]);
  setLocationImage(null); // PostFoundScreen เท่านั้น (PostLostScreen ลบบรรทัดนี้ออก)
  setCategory('');
  setOtherCategory('');
  setDetail('');
  setLocation('');
  setShowCategoryDD(false);
  setShowLocationDD(false);
  setLocationDetail('');
  setReceiveLocation(''); // PostFoundScreen เท่านั้น
  setMapSearch('');
  setDate(todayFormatted());
  setMarkerCoord(null);
  setSearchResults([]);
  setConfirmed(false);
};
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFAF5' }}>
      <LinearGradient colors={['#FFBB6B', '#F97316']} style={styles.header}>
        <TouchableOpacity onPress={() => { resetForm();  router.replace('/post');  }} style={styles.backBtn} >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>แจ้งพบของ</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.form} showsVerticalScrollIndicator={false} key={isEdit ? 'edit' : 'create'} scrollEnabled={!mapScrollLocked}>
    
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
        <Text style={styles.label}>ประเภทของที่พบ</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setShowCategoryDD(!showCategoryDD)}>
          <Text style={category ? styles.ddValue : styles.ddPlaceholder}>
            {category || 'เลือกประเภทสิ่งของที่พบ'}
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
        {/* ถ้าเลือกอื่น ๆ ให้กรอกเอง */}
        {category === 'อื่น ๆ' && (
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            placeholder="โปรดระบุประเภทสิ่งของที่พบ"
            placeholderTextColor="#bbb"
            value={otherCategory}
            onChangeText={setOtherCategory}
          />
        )}

        {/* รายละเอียด */}
        <Text style={styles.label}>รายละเอียด</Text>
        <TextInput style={[styles.input, styles.textarea]}
          placeholder="อธิบายลักษณะของที่พบ..." placeholderTextColor="#bbb"
          multiline value={detail} onChangeText={setDetail} />

        {/* วันที่พบ */}
        <Text style={styles.label}>วันที่พบ</Text>
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

        {/* สถานที่พบ */}
        <Text style={styles.label}>สถานที่พบ</Text>
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

        {/* ค้นหาสถานที่ ถ้าเลือก อื่น ๆ */}
        {location === 'อื่น ๆ' && (
            <>
              <Text style={styles.label}>ค้นหาสถานที่</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={{ flex: 1, fontSize: 14, color: '#333' }}
                  placeholder="พิมพ์ชื่อสถานที่"
                  placeholderTextColor="#bbb"
                  value={mapSearch}
                  onChangeText={(text) => {
                  setMapSearch(text);
                  setConfirmed(false);

                  // ✅ debounce 500ms
                  if (searchTimeout.current) clearTimeout(searchTimeout.current);
                  if (text.trim().length < 2) {
                    setSearchResults([]);
                    return;
                  }
                  searchTimeout.current = setTimeout(() => {
                    searchPlace(text); // ส่ง text เข้าไปตรงๆ
                  }, 500);
                }}
                onSubmitEditing={() => searchPlace(mapSearch)}
                returnKeyType="search"
              />
                <TouchableOpacity onPress={() => searchPlace(mapSearch)}>
                  <Ionicons name="search" size={20} color="#FBAA58" />
                </TouchableOpacity>
              </View>

              {/* ผลการค้นหา */}
              {searchResults.length > 0 && (
                <View style={styles.searchResultBox}>
                  {searchResults.map((place, i) => (
                    <TouchableOpacity key={i} style={styles.searchResultItem} onPress={() => selectPlace(place)}>
                      <Ionicons name="location-outline" size={16} color="#FBAA58" />
                      <Text style={styles.searchResultText} numberOfLines={2}>
                        {place.display_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* แผนที่ WebView */}
              {markerCoord && (
                <View style={{ height: 260, borderRadius: 12, overflow: 'hidden', marginTop: 10 }}>
                <WebView
                  style={{ flex: 1 }}
                  onMessage={(e) => {
                    const { lat, lon } = JSON.parse(e.nativeEvent.data);
                    setMarkerCoord({ latitude: lat, longitude: lon });
                    setConfirmed(false);
                  }}
                  onTouchStart={() => setMapScrollLocked(true)}
                  onTouchEnd={() => setMapScrollLocked(false)}
                  onTouchCancel={() => setMapScrollLocked(false)}
                  source={{
                    html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { margin: 0; padding: 0; }
                  #map { width: 100%; height: 100vh; }
                  .drag-hint {
                    position: absolute; bottom: 10px; left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0,0,0,0.55); color: #fff;
                    font-size: 12px; padding: 4px 12px;
                    border-radius: 20px; z-index: 999; white-space: nowrap;
                  }
                </style>
              </head>
              <body>
                <div id="map"></div>
                <div class="drag-hint">ลากหมุดเพื่อปรับตำแหน่ง</div>
                <script>
                  function initMap() {
                    var pos = { lat: ${markerCoord.latitude}, lng: ${markerCoord.longitude} };
                    var map = new google.maps.Map(document.getElementById('map'), {
                      center: pos,
                      zoom: 17,
                      disableDefaultUI: true,
                      zoomControl: true,
                    });
                    var marker = new google.maps.Marker({
                      position: pos,
                      map: map,
                      draggable: true,
                    });
                    marker.addListener('dragend', function() {
                      var p = marker.getPosition();
                      window.ReactNativeWebView.postMessage(
                        JSON.stringify({ lat: p.lat(), lon: p.lng() })
                      );
                    });
                  }
                </script>
                <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBQTaITdWwgKSrlTHPunVf5saxtVQdLpCE&callback=initMap" async defer></script>
              </body>
              </html>
                    `
                  }}
                  javaScriptEnabled
                  domStorageEnabled
                  scrollEnabled={false}
                />
              </View>
              )}

              {/* ปุ่มยืนยันจุด */}
              {markerCoord && !confirmed && (
                <TouchableOpacity onPress={handleConfirmLocation} activeOpacity={0.85}>
                  <LinearGradient
                    colors={['#FFBB6B', '#F97316']}
                    style={styles.confirmBtn}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.confirmBtnText}>ยืนยันจุดนี้</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* badge ยืนยันแล้ว */}
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
        <TextInput style={[styles.input, styles.textarea]}
          placeholder="เช่น ชั้น 2 ห้อง B201..." placeholderTextColor="#bbb"
          multiline value={locationDetail} onChangeText={setLocationDetail} />

        {/* สถานที่รับของคืน */}
        <Text style={styles.label}>สถานที่รับของคืน</Text>
        <TextInput style={[styles.input, styles.textarea]}
          placeholder="ระบุสถานที่ที่สามารถรับของคืนได้..." placeholderTextColor="#bbb"
          multiline value={receiveLocation} onChangeText={setReceiveLocation} />

        {/* รูปจุดฝาก */}
        <Text style={styles.label}>อัปโหลดรูปจุดฝาก <Text style={styles.optional}>(แนะนำ)</Text></Text>
        <TouchableOpacity style={styles.imageBox} onPress={pickLocationImage}>
          {locationImage
            ? <Image source={{ uri: locationImage }} style={styles.imageFill} />
            : <>
                <Ionicons name="camera-outline" size={28} color="#FBAA58" />
                <Text style={styles.imageBoxText}>ถ่ายรูป</Text>
              </>
          }
        </TouchableOpacity>

        {/* ปุ่มโพสต์ */}
        <TouchableOpacity 
          activeOpacity={0.85} 
          style={{ marginTop: 28 }} 
          onPress={handlePost}
          disabled={uploading} 
        >
          <LinearGradient colors={['#FFBB6B', '#F97316']} style={styles.btnPost}>
            <Text style={styles.btnPostText}>
              {uploading 
                ? 'กำลังอัปโหลด...' 
                : isEdit          
                  ? 'บันทึกการแก้ไข' 
                  : 'โพสต์'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

       <TouchableOpacity  style={styles.btnDraft}  onPress={() => {
            resetForm();
            router.replace('/post');
          }} >
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
  mapPlaceholder: {
    height: 120, borderRadius: 12, marginTop: 8,
    borderWidth: 1, borderColor: '#F0E6DA', borderStyle: 'dashed',
    backgroundColor: '#FFF8F3', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  mapPlaceholderText: { fontSize: 13, color: '#bbb' },
  coordText: { fontSize: 12, color: '#FBAA58' },
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
