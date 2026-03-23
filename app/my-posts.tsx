import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function MyPostsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'found' | 'lost'>('found');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>โพสต์ของฉัน</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarWrap}>
          <Image source={require('../assets/images/icon.png')} style={styles.avatar} />
        </View>
        <Text style={styles.userId}>B6703776</Text>
      </View>

      <View style={styles.tabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => setActiveTab('found')}>
          <Text style={[styles.tabText, activeTab === 'found' && styles.tabTextActive]}>
            โพสต์พบของ
          </Text>
          {activeTab === 'found' && <View style={styles.tabIndicator} />}
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => setActiveTab('lost')}>
          <Text style={[styles.tabText, activeTab === 'lost' && styles.tabTextActive]}>
            โพสต์หาของ
          </Text>
          {activeTab === 'lost' && <View style={styles.tabIndicator} />}
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* เนื้อหาโพสต์ */}
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
    height: 60,
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
  profileSection: {
    backgroundColor: '#F8C46E',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userId: {
    fontFamily: 'NotoSansThai_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F8C46E',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabText: {
    fontFamily: 'NotoSansThai_400Regular',
    fontSize: 15,
    color: '#FFFFFF99',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontFamily: 'NotoSansThai_600SemiBold',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '60%',
    backgroundColor: '#6B3D14',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFAF3',
  },
});

