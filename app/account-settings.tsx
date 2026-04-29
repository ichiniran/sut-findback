// เพิ่ม import เหล่านี้
import { Ionicons } from '@expo/vector-icons';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getApp } from 'firebase/app';
import { getAuth, PhoneAuthProvider } from 'firebase/auth';
import { doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';


import { useEffect, useRef, useState } from 'react';

import {
  Alert, Animated, KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneModal, setPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [saving, setSaving] = useState(false);
  const sheetAnim = useRef(new Animated.Value(800)).current;
    // ── เพิ่ม OTP state ──
  const recaptchaVerifier = useRef<any>(null);
  const [verificationId, setVerificationId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [sending, setSending] = useState(false);
  const openModal = () => {
    setPhoneModal(true);
    Animated.spring(sheetAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(sheetAnim, {
      toValue: 800,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setPhoneModal(false));
  };
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user?.email) setEmail(user.email);
    if (user) {
      const db = getFirestore();
      getDoc(doc(db, 'users', user.uid)).then((snap) => {
        if (snap.exists()) setPhone(snap.data().phone ?? '');
      });
    }
  }, []);

  const openPhoneModal = () => {
    setPhoneInput(phone);
    setStep('phone'); // reset กลับมา step แรกเสมอ
    setOtpCode('');
    openModal();
  };

  const handleSendOtp = async () => {
    const cleaned = phoneInput.trim();
    if (!/^0[0-9]{9}$/.test(cleaned)) {
      Alert.alert('เบอร์ไม่ถูกต้อง', 'กรุณากรอกเบอร์โทรไทย 10 หลัก');
      return;
    }
    setSending(true);
    try {
      const phoneProvider = new PhoneAuthProvider(getAuth());
      const phone = '+66' + cleaned.substring(1); // 08x → +668x
      const id = await phoneProvider.verifyPhoneNumber(phone, recaptchaVerifier.current);
      setVerificationId(id);
      setStep('otp');
    } catch (e: any) {
      Alert.alert('ส่ง OTP ไม่สำเร็จ', e?.message || 'กรุณาลองใหม่');
    }
    setSending(false);
  };
  const apiKey = getApp().options.apiKey;
  const handleVerifyOtp = async () => {
  setSaving(true);
  try {
    // ✅ Verify OTP ผ่าน Firebase REST API — ไม่สร้าง session ใหม่
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionInfo: verificationId,
          code: otpCode,
        }),
      }
    );

    const result = await response.json();

    if (result.error) {
      Alert.alert('OTP ไม่ถูกต้อง', 'กรุณาลองใหม่');
      setSaving(false);
      return;
    }

    // ✅ OTP ถูกต้อง → บันทึกเบอร์กับ user ปัจจุบัน (UID ไม่เปลี่ยน)
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore();
    await updateDoc(doc(db, 'users', user.uid), { phone: phoneInput.trim() });
    setPhone(phoneInput.trim());
    closeModal();
    Alert.alert('บันทึกสำเร็จ', 'ยืนยันและอัปเดตเบอร์โทรเรียบร้อยแล้ว');

  } catch {
    Alert.alert('เกิดข้อผิดพลาด', 'กรุณาลองใหม่');
  }
  setSaving(false);
};

  return (
    <LinearGradient colors={['#FFFAF5', '#FFFAF5']} style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>

        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#6B4D34" />
          </Pressable>
          <Text style={styles.headerTitle}>จัดการบัญชี</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          <View style={styles.menuCard}>

            {/* EMAIL */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>{email || '-'}</Text>
            </View>

            {/* CHANGE PASSWORD */}
            <Pressable
              onPress={() => router.push('/change-password')}
              style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
            >
              <Text style={styles.menuText}>เปลี่ยนรหัสผ่าน</Text>
              <Ionicons name="chevron-forward" size={18} color="#6B4D34" />
            </Pressable>

            {/* PHONE */}
            <Pressable
              onPress={openPhoneModal}
              style={({ pressed }) => [styles.menuItem, styles.borderTop, pressed && styles.pressed]}
            >
              <Text style={styles.menuText}>เบอร์โทรศัพท์</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 13, color: phone ? '#2d1b10' : '#bbb' }}>
                  {phone || 'ยังไม่ได้เพิ่ม'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#6B4D34" />
              </View>
            </Pressable>

          </View>
        </View>

        {/* PHONE MODAL */}
        <Modal visible={phoneModal} transparent animationType="none">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={{ flex: 1 }} onPress={closeModal} />

          {/* เปลี่ยน View เป็น Animated.View */}
          <Animated.View style={[styles.modalSheet, { transform: [{ translateY: sheetAnim }] }]}>
          <View style={styles.modalHandle} />

          {step === 'phone' ? (
            <>
              <Text style={styles.modalTitle}>
                {phone ? 'แก้ไขเบอร์โทรศัพท์' : 'เพิ่มเบอร์โทรศัพท์'}
              </Text>
              <Text style={styles.modalSub}>ระบบจะส่ง OTP ไปยังเบอร์ของคุณเพื่อยืนยัน</Text>

              <View style={styles.inputWrap}>
                <Ionicons name="call-outline" size={18} color="#F97316" />
                <TextInput
                  style={styles.input}
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  placeholder="0812345678"
                  placeholderTextColor="#bbb"
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus
                />
                {phoneInput.length > 0 && (
                  <Pressable onPress={() => setPhoneInput('')}>
                    <Ionicons name="close-circle" size={18} color="#ccc" />
                  </Pressable>
                )}
              </View>

              <View style={styles.modalBtns}>
                <Pressable style={styles.btnCancel} onPress={closeModal}>
                  <Text style={styles.btnCancelText}>ยกเลิก</Text>
                </Pressable>
                <Pressable
                  style={[styles.btnSave, sending && { opacity: 0.6 }]}
                  onPress={handleSendOtp}
                  disabled={sending}
                >
                  <Text style={styles.btnSaveText}>{sending ? 'กำลังส่ง...' : 'ส่ง OTP'}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.modalTitle}>กรอกรหัส OTP</Text>
              <Text style={styles.modalSub}>รหัส 6 หลักที่ส่งไปยัง {phoneInput}</Text>

              <View style={styles.inputWrap}>
                <Ionicons name="key-outline" size={18} color="#F97316" />
                <TextInput
                  style={styles.input}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  placeholder="000000"
                  placeholderTextColor="#bbb"
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>

              <View style={styles.modalBtns}>
                <Pressable style={styles.btnCancel} onPress={() => setStep('phone')}>
                  <Text style={styles.btnCancelText}>แก้ไขเบอร์</Text>
                </Pressable>
                <Pressable
                  style={[styles.btnSave, saving && { opacity: 0.6 }]}
                  onPress={handleVerifyOtp}
                  disabled={saving}
                >
                  <Text style={styles.btnSaveText}>{saving ? 'กำลังยืนยัน...' : 'ยืนยัน'}</Text>
                </Pressable>
              </View>
            </>
          )}
        </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
          <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={getApp().options}
        attemptInvisibleVerification={true}
      />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 10,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  backButton: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16, fontWeight: '600', color: '#2d1b10',
  },
  content: {
    flex: 1, marginTop: 20, paddingHorizontal: 16,
  },
  menuCard: {
    borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#fff',
  },
  fieldRow: {
    height: 60, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5, borderBottomColor: '#e5d3bd',
  },
  fieldLabel: {
    fontSize: 14, color: '#6B4D34', fontWeight: '600',
  },
  fieldValue: {
    fontSize: 14, color: '#2d1b10', fontWeight: '500',
  },
  menuItem: {
    height: 60, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  borderTop: {
    borderTopWidth: 0.5, borderTopColor: '#e5d3bd',
  },
  pressed: {
    backgroundColor: '#fdf5ee',
  },
  menuText: {
    fontSize: 14, color: '#6B4D34', fontWeight: '500',
  },

  // Modal
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 40,
    gap: 12,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#e5d3bd',
    alignSelf: 'center', marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18, fontWeight: '700', color: '#2d1b10',
  },
  modalSub: {
    fontSize: 13, color: '#a0856a', marginTop: -4,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14, borderWidth: 1.5, borderColor: '#e5d3bd',
    paddingHorizontal: 14, height: 52, gap: 10,
    marginTop: 4,
  },
  input: {
    flex: 1, fontSize: 16, color: '#2d1b10',
    fontWeight: '500',
  },
  modalBtns: {
    flexDirection: 'row', gap: 10, marginTop: 8,
  },
  btnCancel: {
    flex: 1, height: 50, borderRadius: 14,
    borderWidth: 1, borderColor: '#e5d3bd',
    alignItems: 'center', justifyContent: 'center',
  },
  btnCancelText: {
    fontSize: 15, fontWeight: '600', color: '#a0856a',
  },
  btnSave: {
    flex: 2, height: 50, borderRadius: 14,
    backgroundColor: '#F97316',
    alignItems: 'center', justifyContent: 'center',
  },
  btnSaveText: {
    fontSize: 15, fontWeight: '700', color: '#fff',
  },
});