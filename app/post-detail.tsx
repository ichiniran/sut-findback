import ReportModal from "@/components/ReportModal";
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { deleteDoc, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { WebView } from 'react-native-webview';
// ── UserAvatar: show user photoURL or fallback letter ──
// Place this at the very end of the file, after all other code
import BottomSheetMenu from '@/components/BottomSheetMenu';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BookmarkButton from '../components/BookmarkButton';
import { app } from '../constants/firebase';

const COLORS = {
  primary: '#F97316',
  primaryLight: '#FEF0E3',
  bg: '#ffffff',
  card: '#FFFFFF',
  textMain: '#1A1A1A',
  textMuted: '#9A9A9A',
  border: '#EEEBE6',
  green: '#16a34a',
  greenLight: '#f0fdf4',
  greenBorder: '#bbf7d0',
};

export default function PostDetail() {
  const [isSaving, setIsSaving] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string> & { onPostDeleted?: any }>();
  const {
    postId,
    userId,
    type,
    title,
    detail,
    location,
    locationName,
    locationDetail,
    receiveLocation,
    username,
    user,
    date,
    createdAt,
    images,
    imageUri,
    locationImage,
    category,
    latitude,
    longitude,
    currentStatus,
    onPostDeleted,
  } = params;

  const isFound = type === 'found';
  // ตรวจสอบสถานะ saved เมื่อเปิดหน้ารายละเอียด
  useEffect(() => {
    const checkSaved = async () => {
      try {
        const auth = getAuth(app);
        const user = auth.currentUser;
        if (!user || !postId) {
          setSaved(false);
          return;
        }
        const db = getFirestore(app);
        const saveType = isFound ? 'saved_found' : 'saved_lost';
        const ref = doc(db, 'users', user.uid, saveType, postId);
        const snap = await (await import('firebase/firestore')).getDoc(ref);
        setSaved(snap.exists());
      } catch {
        setSaved(false);
      }
    };
    checkSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, type]);

  // ---- parse รูปสิ่งของ (gallery บน) ----
  let itemImages: string[] = [];
  if (images) {
    try { itemImages = JSON.parse(images); } catch { itemImages = [images]; }
  }
  if (itemImages.length === 0 && imageUri) itemImages = [imageUri];

  const [imgIdx, setImgIdx] = useState(0);
  const screenWidth = Dimensions.get('window').width;

  const [status, setStatus] = useState<'waiting' | 'claimed'>(
    currentStatus === 'claimed' ? 'claimed' : 'waiting'
  );

  const displayUser = username || user || '-';
  const displayDate = date || (createdAt ? createdAt.split('T')[0] : '-');
  const displayLocation = locationName || location || '-';
  const auth = getAuth(app);
  const currentUid = auth.currentUser?.uid;
  const isOwner = currentUid === userId;
  const handleClaimed = () => {
  Alert.alert(
    isFound ? 'ยืนยันการรับของ' : 'ยืนยันการได้รับของ',
    isFound ? 'ยืนยันว่าเจ้าของได้มารับของแล้วใช่ไหม?' : 'ยืนยันว่าคุณได้รับของคืนแล้วใช่ไหม?',
    [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ยืนยัน',
        onPress: async () => {
          setStatus('claimed');
          try {
            const db = getFirestore(app);
            const { updateDoc, doc } = await import('firebase/firestore');
            // แยก collection ตาม type
            const collection = isFound ? 'found_posts' : 'lost_posts';
            await updateDoc(doc(db, 'users', userId!, collection, postId!), {
              status: 'claimed'
            });
          } catch (e) {
            console.log('update status error:', e);
          }
        },
      },
    ]
  );
};

const handleChat = () => {
  const auth = getAuth(app);
  const currentUser = auth.currentUser;
  if (!currentUser) {
    Alert.alert('กรุณาเข้าสู่ระบบก่อนติดต่อ');
    return;
  }

  router.push({
    pathname: '../chat/[id]',
    params: {
      targetUid: userId || '',
      targetName: displayUser,
      postTitle: title || '',
      postId: postId || '',
      postType: type || '',
      postImageUri: itemImages[0] || '',
      postLocationName: displayLocation,
      postDate: displayDate,
      postDetail: detail || '',
      postLocation: location || '',
      postLocationDetail: locationDetail || '',
      postReceiveLocation: receiveLocation || '',
      postUsername: displayUser,
      postUserId: userId || '',
      postImages: images || '',
      postCategory: category || '',
      postLatitude: latitude || '',
      postLongitude: longitude || '',
      postCurrentStatus: currentStatus || '',
    },
  });
};
  const handleShare = async () => {
    await Share.share({ message: `พบของ: ${title}\nสถานที่: ${displayLocation}\nวันที่: ${displayDate}` });
  };

  // Bookmark handler
  const handleBookmark = async () => {
    setIsSaving(true);
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('กรุณาเข้าสู่ระบบก่อนบันทึกโพสต์');
        setIsSaving(false);
        return;
      }
      const db = getFirestore(app);
      const saveType = isFound ? 'saved_found' : 'saved_lost';
      const ref = doc(db, 'users', user.uid, saveType, postId!);
      if (!saved) {
        await setDoc(
          ref,
          {
            postId,
            type,
            title,
            detail,
            location,
            locationName,
            locationDetail,
            receiveLocation,
            username,
            user: user.uid,
            userId,
            date,
            createdAt,
            images,
            imageUri,
            locationImage,
            category,
            latitude,
            longitude,
            currentStatus,
            savedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        setSaved(true);
      } else {
        await deleteDoc(ref);
        setSaved(false);
      }
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาดในการบันทึกโพสต์');
    }
    setIsSaving(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      {/* Top Nav */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textMain} />
        </TouchableOpacity>
        <View style={styles.navUserInfo}>
          <View style={styles.navAvatar}>
            {userId ? (
              <UserAvatar uid={userId} fallback={displayUser !== '-' ? displayUser[0].toUpperCase() : 'U'} />
            ) : (
              <Text style={styles.navAvatarText}>{displayUser !== '-' ? displayUser[0].toUpperCase() : 'U'}</Text>
            )}
          </View>
          <View>
            <Text style={styles.navUsername}>{displayUser}</Text>
            <Text style={styles.navTime}>โพสต์เมื่อ {displayDate}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.textMuted}  onPress={() => setMenuVisible(true)}/>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Gallery */}
        <View style={styles.imageBox}>
          {itemImages.length > 0 ? (
            <>
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                onScroll={e => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / screenWidth))}
                scrollEventThrottle={16}
              >
                {itemImages.map((uri, idx) => (
                  <Image key={idx} source={{ uri }} style={{ width: screenWidth, height: 300 }} resizeMode="cover" />
                ))}
              </ScrollView>
              {itemImages.length > 1 && (
                <>
                  <View style={styles.dots}>
                    {itemImages.map((_, i) => (
                      <View key={i} style={[styles.dot, i === imgIdx && styles.dotActive]} />
                    ))}
                  </View>
                  <View style={styles.imageCounter}>
                    <Text style={styles.imageCounterText}>{imgIdx + 1}/{itemImages.length}</Text>
                  </View>
                </>
              )}
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={48} color="rgba(63, 63, 63, 0.4)" />
              <Text style={styles.noImageText}>ไม่มีรูปภาพ</Text>
            </View>
          )}
          <View style={[styles.badge, { borderColor: isFound ? COLORS.primary : '#EF4444' }]}>
            <Text style={[styles.badgeText, { color: isFound ? COLORS.primary : '#EF4444' }]}>{isFound ? 'พบของ' : 'ของหาย'}</Text>
          </View>
        </View>

        {/* Content Card */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.postTitle} numberOfLines={2} ellipsizeMode="tail">{title || 'ไม่ระบุชื่อ'}</Text>
            <BookmarkButton
              postId={postId} type={type}
              postData={{ postId, type, title, detail, location, locationName, locationDetail, receiveLocation, username, user, userId, date, createdAt, images, imageUri, locationImage, category, latitude, longitude, currentStatus }}
            />
          </View>
          <StatusChip status={status} isFound={isFound} />
          <View style={styles.divider} />

          <View style={styles.infoList}>
            {category ? <InfoRow icon="pricetag-outline" label="หมวดหมู่" value={category} /> : null}
            {detail ? <InfoRow icon="document-text-outline" label="รายละเอียด" value={detail} /> : null}
            <InfoRow icon="calendar-outline" label={isFound ? 'วันที่พบ' : 'วันที่หาย'} value={displayDate} />
            <InfoRow icon="location-outline" label={isFound ? 'สถานที่พบ' : 'สถานที่หาย'} value={displayLocation} sub={locationDetail || undefined} />
            {latitude && longitude ? (
              <View style={{ marginHorizontal: 20, marginTop: 8, borderRadius: 12, overflow: 'hidden', height: 200 }}>
                <WebView
                  style={{ flex: 1 }}
                  javaScriptEnabled
                  domStorageEnabled
                  scrollEnabled={false}
                  source={{
                    html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { margin: 0; padding: 0; }
                #map { width: 100%; height: 100vh; }
              </style>
            </head>
            <body>
              <div id="map"></div>
              <script>
                function initMap() {
                  var pos = { lat: ${parseFloat(latitude)}, lng: ${parseFloat(longitude)} };
                  var map = new google.maps.Map(document.getElementById('map'), {
                    center: pos,
                    zoom: 17,
                    disableDefaultUI: true,
                    zoomControl: false,
                    gestureHandling: 'none',
                  });
                  new google.maps.Marker({
                    position: pos,
                    map: map,
                  });
                }
              </script>
              <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBQTaITdWwgKSrlTHPunVf5saxtVQdLpCE&callback=initMap" async defer></script>
            </body>
            </html>
                    `
                  }}
                />
              </View>
            ) : null}

            {receiveLocation ? (
              <View style={styles.infoRow}>
                <Ionicons name="hand-left-outline" size={20} color={COLORS.primary} style={styles.infoIcon} />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>สถานที่รับคืน</Text>
                  <Text style={styles.infoValue}>{receiveLocation}</Text>
                  {locationImage ? (
                    <View style={styles.locationImageWrap}>
                      <Image source={{ uri: locationImage }} style={styles.locationImageThumb} resizeMode="cover" />
                      <View style={styles.locationImageLabel}>
                        <Ionicons name="camera" size={11} color="#fff" />
                        <Text style={styles.locationImageLabelText}>รูปจุดฝาก</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : locationImage ? (
              <View style={styles.infoRow}>
                <Ionicons name="camera-outline" size={20} color={COLORS.primary} style={styles.infoIcon} />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>รูปจุดฝาก</Text>
                  <View style={styles.locationImageWrap}>
                    <Image source={{ uri: locationImage }} style={styles.locationImageThumb} resizeMode="cover" />
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>

      {/*Sticky Bottom Buttons */}
      <View style={styles.stickyBottom}>
        {isFound ? (
          <>
            {!isOwner && (
              <TouchableOpacity
                style={[styles.btnPrimary, status === 'claimed' && styles.btnDisabled]}
                onPress={handleChat} disabled={status === 'claimed'}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
                <Text style={styles.btnPrimaryText}>ติดต่อรับคืน</Text>
              </TouchableOpacity>
            )}
            {!isOwner && (
              status === 'waiting' ? (
                <TouchableOpacity style={styles.btnGreen} onPress={handleClaimed}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.green} />
                  <Text style={styles.btnGreenText}>ฉันมารับแล้ว</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.btnClaimed}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
                  <Text style={styles.btnClaimedText}>เจ้าของมารับแล้ว</Text>
                </View>
              )
            )}
          </>
        ) : (
          <>
            {!isOwner && (
              <TouchableOpacity style={styles.btnPrimary} onPress={handleChat}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
                <Text style={styles.btnPrimaryText}>ติดต่อเจ้าของ</Text>
              </TouchableOpacity>
            )}
            {isOwner && (
              status === 'waiting' ? (
                <TouchableOpacity style={styles.btnGreen} onPress={handleClaimed}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.green} />
                  <Text style={styles.btnGreenText}>ฉันได้รับของแล้ว</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.btnClaimed}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
                  <Text style={styles.btnClaimedText}>ได้รับของแล้ว</Text>
                </View>
              )
            )}
          </>
        )}
      </View>
       <BottomSheetMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          isOwner={isOwner}

          onSave={() => console.log("save")}
          onEdit={() => {
              setMenuVisible(false);
              const targetPath = isFound ? '../post-found' : '../post-lost';
              router.push({
                pathname: targetPath,
                params: {
                  mode: 'edit',
                  postId,
                  userId,
                  type,
                  title,        
                  category,
                  detail,
                  location,
                  locationName,
                  locationDetail,
                  receiveLocation,
                  images,
                  imageUri,
                  locationImage,
                  date,
                  latitude,
                  longitude,
                },
              });
            }}
          onDelete={async () => {
            if (!postId || !userId) return;
            Alert.alert(
              'ลบโพสต์',
              'คุณต้องการลบโพสต์นี้หรือไม่?',
              [
                { text: 'ยกเลิก', style: 'cancel' },
                {
                  text: 'ลบ',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const db = getFirestore(app);
                      const collection = isFound ? 'found_posts' : 'lost_posts';
                      await deleteDoc(doc(db, 'users', userId, collection, postId));
                      await deleteDoc(doc(db, collection, postId));
                      Alert.alert('ลบโพสต์สำเร็จ');
                      if (typeof onPostDeleted === 'function') {
                        onPostDeleted();
                      }
                      router.back();
                    } catch (e) {
                      Alert.alert('เกิดข้อผิดพลาดในการลบโพสต์');
                    }
                  },
                },
              ]
            );
          }}
          onReport={() => setReportVisible(true)}
        />
        <ReportModal
          visible={reportVisible}
          onClose={() => setReportVisible(false)}
          selectedReason={selectedReason}
          setSelectedReason={setSelectedReason}
          onSubmit={() => {
            console.log("report:", selectedReason);
            setReportVisible(false);
            setSelectedReason("");
          }}
/>
    </SafeAreaView>
  );
}

// ── StatusChip ──
function StatusChip({ status, isFound }: { status: 'waiting' | 'claimed'; isFound: boolean }) {
  if (status === 'claimed') {
    return (
      <View style={[styles.statusChip, { backgroundColor: COLORS.greenLight }]}>
        <Ionicons name="checkmark-circle" size={13} color={COLORS.green} />
        <Text style={[styles.statusText, { color: COLORS.green }]}>
          {isFound ? 'เจ้าของมารับแล้ว' : 'ได้รับของแล้ว'}
        </Text>
      </View>
    );
  }
  if (!isFound) {
    return (
      <View style={[styles.statusChip, { backgroundColor: '#FEF2F2' }]}>
        <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
        <Text style={[styles.statusText, { color: '#B91C1C' }]}>ยังตามหาของอยู่</Text>
      </View>
    );
  }
  return (
    <View style={[styles.statusChip, { backgroundColor: '#FFF3E0' }]}>
      <View style={[styles.statusDot, { backgroundColor: '#E65100' }]} />
      <Text style={[styles.statusText, { color: '#E65100' }]}>รอเจ้าของมารับ</Text>
    </View>
  );
}
// ── InfoRow ──
function InfoRow({
  icon, label, value, sub,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color={COLORS.primary} style={styles.infoIcon} />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
        {sub ? <Text style={styles.infoSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 0,
      gap: 8,
    },
    bookmarkBtn: {
      marginLeft: 8,
      padding: 6,
    },
  safe: { flex: 1, backgroundColor: COLORS.card },
  topNav: {
    backgroundColor: COLORS.card, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center',
  },
  navUserInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  navAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#f8e8dc', alignItems: 'center', justifyContent: 'center',
  },
  navAvatarText: {  color: '#6E4D31', fontWeight: '700', fontSize: 13 },
  navUsername: { fontSize: 14, fontWeight: '600', color: COLORS.textMain },
  navTime: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  scroll: { flex: 1, backgroundColor: COLORS.bg },

  imageBox: { width: '100%', height: 300, backgroundColor: '#ffffff', position: 'relative' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' },
  noImageText: { color: 'rgba(33, 26, 26, 0.52)', marginTop: 8, fontSize: 13 },
  badge: {
    position: 'absolute', top: 14, right: 14,backgroundColor: '#ffffff91',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 2
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  dots: {
    position: 'absolute', bottom: 12,
    left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { width: 18, backgroundColor: '#fff' },
  imageCounter: {
    position: 'absolute', bottom: 12, right: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
  },
  imageCounterText: { color: '#fff', fontSize: 11 },

  card: { backgroundColor: COLORS.card, marginTop: 8, paddingTop: 20, paddingBottom: 8 },
  postTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textMain,
    marginRight: 8,
    marginBottom: 2,
  },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', marginHorizontal: 20,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },

  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 20, marginVertical: 18 },

  infoList: { paddingHorizontal: 20, gap: 18 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  infoIcon: { marginTop: 2, width: 22 },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 3 },
  infoValue: { fontSize: 15, fontWeight: '500', color: COLORS.textMain, lineHeight: 22 },
  infoSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },

  // รูปจุดฝาก
  locationImageWrap: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'flex-start',
  },
  locationImageThumb: {
    width: 220,
    height: 130,
    borderRadius: 12,
  },
  locationImageLabel: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  locationImageLabelText: { color: '#fff', fontSize: 11, fontWeight: '500' },

  actionArea: { paddingHorizontal: 20, paddingBottom: 8, gap: 10 },
  btnPrimary: {
    paddingVertical: 16, backgroundColor: COLORS.primary,
    borderRadius: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  btnDisabled: { backgroundColor: '#ccc', shadowOpacity: 0 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnGreen: {
    paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.greenBorder,
    backgroundColor: COLORS.greenLight,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnGreenText: { color: COLORS.green, fontSize: 15, fontWeight: '600' },
  btnClaimed: {
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: COLORS.greenLight,
    borderWidth: 1.5, borderColor: COLORS.greenBorder,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnClaimedText: { color: COLORS.green, fontSize: 15, fontWeight: '600' },
  stickyBottom: {
  paddingHorizontal: 20,
  paddingVertical: 12,
  paddingBottom: 8,
  backgroundColor: COLORS.card,
  borderTopWidth: 1,
  borderTopColor: COLORS.border,
  gap: 10,
},
});


// ── UserAvatar: show user photoURL or fallback letter ──
// Place this at the very end of the file, after all other code
type UserAvatarProps = {
  uid: string;
  fallback: string;
};

function UserAvatar({ uid, fallback }: UserAvatarProps) {
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    const fetchPhoto = async () => {
      try {
        const db = getFirestore(app);
        const snap = await getDoc(doc(db, 'users', uid));
        console.log('uid:', uid);                          // เพิ่ม
        console.log('exists:', snap.exists());             // เพิ่ม
        console.log('photoURL:', snap.data()?.photoURL);  // เพิ่ม
        if (mounted && snap.exists()) {
          setPhotoURL(snap.data().photoURL || null);
        }
      } catch (e) {
        console.log('UserAvatar error:', e);  // เพิ่ม
        if (mounted) setPhotoURL(null);
      }
    };
    fetchPhoto();
    return () => { mounted = false; };
  }, [uid]);
  if (photoURL) {
    return (
      <Image source={{ uri: photoURL }} style={{ width: 38, height: 38, borderRadius: 19 }} />
    );
  }
  return (
    <Text style={styles.navAvatarText}>{fallback}</Text>
  );
}