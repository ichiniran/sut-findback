import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร");
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || !user.email) {
        Alert.alert("กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      // ✅ Re-authenticate ก่อน
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // แล้วค่อยเปลี่ยนรหัสผ่าน
      await updatePassword(user, newPassword);

      Alert.alert("สำเร็จ", "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.back();

    } catch (error: any) {
      console.log(error);
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        Alert.alert("รหัสผ่านปัจจุบันไม่ถูกต้อง");
      } else {
        Alert.alert("เกิดข้อผิดพลาด", error.message);
      }
    }
  };

  return (
    <LinearGradient colors={['#FFFAF5', '#FFFAF5']} style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>

        {/* HEADER */}
        <BlurView intensity={60} tint="light" style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#6B4D34" />
          </Pressable>
          <Text style={styles.headerTitle}>เปลี่ยนรหัสผ่าน</Text>
          <View style={{ width: 40 }} />
        </BlurView>

        {/* CONTENT */}
        <View style={styles.content}>
          <View style={styles.menuCard}>

            {/* รหัสผ่านปัจจุบัน */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>รหัสผ่านปัจจุบัน</Text>
              <TextInput
                style={styles.inputField}
                placeholder="กรอกรหัสผ่านปัจจุบัน"
                placeholderTextColor="#cbb7a0"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
            </View>

            {/* รหัสผ่านใหม่ */}
            <View style={styles.inputRowWithBorder}>
              <Text style={styles.inputLabel}>รหัสผ่านใหม่</Text>
              <TextInput
                style={styles.inputField}
                placeholder="กรอกรหัสผ่านใหม่"
                placeholderTextColor="#cbb7a0"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            {/* ยืนยันรหัสผ่าน */}
            <View style={styles.inputRowWithBorder}>
              <Text style={styles.inputLabel}>ยืนยันรหัสผ่าน</Text>
              <TextInput
                style={styles.inputField}
                placeholder="ยืนยันรหัสผ่านใหม่"
                placeholderTextColor="#cbb7a0"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

          </View>

          {/* BUTTON */}
          <Pressable style={{ borderRadius: 16 }} onPress={handleChangePassword}>
            <View style={styles.submitButton}     >
              <Text style={styles.submitText}>บันทึก</Text>
            </View>
          </Pressable>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    //backgroundColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
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
  content: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 16,
  },
  menuCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  inputRow: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputRowWithBorder: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#e5d3bd',
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B4D34',
    flex: 0.4,
  },
  inputField: {
    flex: 0.6,
    fontSize: 14,
    color: '#2d1b10',
    textAlign: 'right',
    padding: 0,
  },
  submitButton: {
    marginTop: 24,
    height: 50,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    backgroundColor: '#ff8c39',
  },
  submitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});