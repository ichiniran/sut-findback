import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getAuth, updateProfile } from 'firebase/auth';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../components/UserContext';
import { app } from '../constants/firebase';
export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser, loading } = useUser();
  const [username, setUsername] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // sync username/photoURL จาก context ทุกครั้งที่ user เปลี่ยน
  useEffect(() => {
    setUsername(user?.username || '');
    setPhotoURL(user?.photoURL || null);
    setNewPhoto(null);
  }, [user]);

  // ฟังก์ชันเลือกรูปใหม่
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('กรุณาอนุญาตการเข้าถึงรูปภาพ');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setNewPhoto(result.assets[0].uri);
    }
  };

  // ฟังก์ชันบันทึกโปรไฟล์
    const handleSave = async () => {
    setSaving(true);
    try {
        const auth = getAuth(app);
        const fbUser = auth.currentUser;
        if (!fbUser) throw new Error('No user');
        const db = getFirestore(app);

        // อัปเดตชื่อ
        await updateProfile(fbUser, { displayName: username });
        await updateDoc(doc(db, 'users', fbUser.uid), { username });

        // อัปเดตรูป → upload ไป Cloudinary
        if (newPhoto) {
        const formData = new FormData();
        const ext = newPhoto.split('.').pop()?.toLowerCase() || 'jpg';
            const mimeType = ext === 'png' ? 'image/png' : ext === 'heic' ? 'image/heic' : 'image/jpeg';

            formData.append('file', {
            uri: newPhoto,
            type: mimeType,
            name: `profile.${ext}`,
            } as any);
        formData.append('upload_preset', 'nxbvgcct');
        formData.append('cloud_name', 'dto2v8z6t');

        const res = await fetch(
            'https://api.cloudinary.com/v1_1/dto2v8z6t/image/upload',
            { method: 'POST', body: formData }
        );
        const data = await res.json();
        const downloadURL = data.secure_url;

        await updateProfile(fbUser, { photoURL: downloadURL });
        await updateDoc(doc(db, 'users', fbUser.uid), { photoURL: downloadURL });

        setPhotoURL(downloadURL);
        setNewPhoto(null);
        setUser({ photoURL: downloadURL });
        }

        setUser({ username });
        alert('บันทึกโปรไฟล์สำเร็จ');
    } catch (e) {
        console.log('ERROR:', e);
        alert('เกิดข้อผิดพลาดในการบันทึกโปรไฟล์');
    }
    setSaving(false);
    };

  // ฟังก์ชันลบรูปโปรไฟล์
  const handleRemovePhoto = async () => {
    setSaving(true);
    try {
      const auth = getAuth(app);
      const fbUser = auth.currentUser;
      if (!fbUser) throw new Error('No user');
      const db = getFirestore(app);
      await updateProfile(fbUser, { photoURL: null });
      await updateDoc(doc(db, 'users', fbUser.uid), { photoURL: null });
      setPhotoURL(null);
      setNewPhoto(null);
      setUser({ photoURL: null });
      alert('ลบรูปโปรไฟล์เรียบร้อย');
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการลบรูปโปรไฟล์');
    }
    setSaving(false);
  };

  // ขนาด avatar/fallback text
  const avatarSize = styles.avatar.width || 70;

  return (
    <LinearGradient colors={['#FFFAF5', '#FFFAF5']} style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#6B4D34" />
          </Pressable>
          <Text style={styles.headerTitle}>แก้ไขโปรไฟล์</Text>
          <View style={{ width: 40 }} />
        </View>
        {/* BODY */}
        <View style={styles.body}>
          {/* PROFILE IMAGE */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarWrap} onPress={handlePickImage} activeOpacity={0.8} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#f8e8dc" />
              ) : ( (newPhoto || photoURL) ? (
                <Image source={{ uri: newPhoto || photoURL! }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: '#f8e8dc', justifyContent: 'center', alignItems: 'center' }]}> 
                  <Text style={{ fontSize: avatarSize * 0.6, color: '#6E4D31', fontWeight: '700', textAlign: 'center' }}>
                    {username && username !== '-' ? username[0].toUpperCase() : 'U'}
                  </Text>
                </View>
              ))}
              {/* overlay ไอคอนกล้อง */}
              {!loading && (
                <View style={styles.cameraOverlay}>
                  <Ionicons name="camera" size={28} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.uploadText}>แตะเพื่อเปลี่ยนรูปภาพ</Text>
            {(!loading && (photoURL || newPhoto)) && (
              <TouchableOpacity style={styles.removePhotoBtn} onPress={handleRemovePhoto} disabled={saving} activeOpacity={0.85}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={styles.removePhotoText}>ลบรูปโปรไฟล์</Text>
              </TouchableOpacity>
            )}
          </View>
           
          {/* INFO CARD */}
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>ชื่อผู้ใช้</Text>
              <TextInput
                style={[styles.value, { minWidth: 80, flex: 1, textAlign: 'right' }]}
                value={username}
                onChangeText={setUsername}
                placeholder="-"
                maxLength={30}
                autoCapitalize="none"
              />
            </View>
          </View>
          {/* ปุ่มบันทึก */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d1b10',
  },

  body: {
    flex: 1,
    backgroundColor: '#FFFAF5',
  },

  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  avatarWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f8e8dc',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },

  uploadText: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
  },

  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5d3bd',
  },

  row: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  label: {
    fontSize: 14,
    color: '#6B4D34',
  },

  value: {
    fontSize: 14,
    color: '#999',
  },
   cameraOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -18 }, { translateY: -18 }],
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    padding: 4,
    zIndex: 2,
  },
  saveBtn: {
    marginTop: 32,
    marginHorizontal: 32,
    backgroundColor: '#ff9c55',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
   removePhotoBtn: {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              alignSelf: 'center',
              marginTop: 8,
              
            },
            removePhotoText: {
              color: '#EF4444',
              fontSize: 13,
              fontWeight: '600',
            },
});