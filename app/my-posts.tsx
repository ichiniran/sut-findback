import { useUser } from '@/components/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MyFoundScreen from './myfound';
import MyLostScreen from './mylost';

export default function MyPostsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'myfound' | 'mylost'>('myfound');
  const { user } = useUser();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>

      {/* HEADER */}
      <LinearGradient
        colors={['#ffffff', '#ffffff']}
        style={styles.header}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#333" />
        </Pressable>

        <Text style={styles.headerTitle}>โพสต์ของฉัน</Text>

        <View style={{ width: 40 }} />
      </LinearGradient>
    
      {/* PROFILE */}
      <View style={styles.profileSection}>
      <View style={styles.avatarWrap}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: '#f8e8dc', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 24, color: '#6E4D31', fontWeight: '700' }}>
              {user?.username ? user.username[0].toUpperCase() : 'U'}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.userId}>{user?.username || '-'}</Text>
    </View>

      {/* TAB BAR */}
      <View style={styles.tabBar}>
        <Pressable style={styles.tabItem} onPress={() => setActiveTab('myfound')}>
          <Text style={[styles.tabLabel, activeTab === 'myfound' && styles.tabLabelActive]}>
            โพสต์พบของ
          </Text>
          {activeTab === 'myfound' && <View style={styles.tabIndicator} />}
        </Pressable>

        <Pressable style={styles.tabItem} onPress={() => setActiveTab('mylost')}>
          <Text style={[styles.tabLabel, activeTab === 'mylost' && styles.tabLabelActive]}>
            โพสต์หาของ
          </Text>
          {activeTab === 'mylost' && <View style={styles.tabIndicator} />}
        </Pressable>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
         {activeTab === 'myfound' ? <MyFoundScreen /> : <MyLostScreen />}
      </View>

    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  header: {
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  profileSection: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },

  avatarWrap: {
    width: 70,
    height: 70,
    borderRadius: 40,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 40,
  },

  userId: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },

  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },

  tabLabelActive: {
    color: '#F97316',
  },

  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '50%',
    backgroundColor: '#F97316',
    borderRadius: 2,
  },

  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
});