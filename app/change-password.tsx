import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>เปลี่ยนรหัสผ่าน</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.menuCard}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>รหัสผ่านเดิม</Text>
            <TextInput
              style={styles.inputField}
              placeholder="S-รหัสผ่านเดิม"
              placeholderTextColor="#D4D4D4"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />
          </View>

          <View style={styles.inputRowWithBorder}>
            <Text style={styles.inputLabel}>รหัสผ่านใหม่</Text>
            <TextInput
              style={styles.inputField}
              placeholder="S-รหัสผ่านใหม่"
              placeholderTextColor="#D4D4D4"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          <View style={styles.inputRowWithBorder}>
            <Text style={styles.inputLabel}>ยืนยันรหัสผ่านใหม่</Text>
            <TextInput
              style={styles.inputField}
              placeholder="S-รหัสผ่านใหม่"
              placeholderTextColor="#D4D4D4"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
        </View>

        <Pressable style={styles.submitButton}>
          <Text style={styles.submitText}>บันทึก</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8C46E',
  },
  header: {
    backgroundColor: '#F8C46E',
    height: 70,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'NotoSansThai_600SemiBold',
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingTop: 8,
    backgroundColor: '#FFFAF3',
  },
  menuCard: {
    backgroundColor: '#ffffff',
    fontFamily: 'NotoSansThai_400Regular',
  },
  inputRow: {
    height: 68,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputRowWithBorder: {
    height: 68,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#B49B83',
  },
  inputLabel: {
    fontFamily: 'NotoSansThai_400Regular',
    fontSize: 14,
    color: '#6B4D34',
    flex: 0.4,
  },
  inputField: {
    flex: 0.6,
    fontFamily: 'NotoSansThai_400Regular',
    fontSize: 14,
    color: '#6B4D34',
    textAlign: 'right',
    padding: 0,
  },
  submitButton: {
    marginTop: 20,
    marginHorizontal: 18,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8C46E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontFamily: 'NotoSansThai_600SemiBold',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

