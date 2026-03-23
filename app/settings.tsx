import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Switch, Text, View } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const [notification, setNotification] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>การตั้งค่า</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.menuCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>การแจ้งเตือน</Text>
            <Switch style={{ marginTop:10 }}
              value={notification}
              onValueChange={setNotification}
              trackColor={{ false: '#D4D4D4', true: '#81C784' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
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
  settingRow: {
    height: 68,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical:10,
  },
  settingRowWithBorder: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#B49B83',
  },
  settingLabel: {
    fontFamily: 'NotoSansThai_400Regular',
    fontSize: 14,
    color: '#6B4D34',
  },
});

