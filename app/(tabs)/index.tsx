import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import FilterModal, { FilterOptions } from '../../components/FilterModal';
import FoundScreen from './found';
import LostScreen from './lost';

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<'found' | 'lost'>('found');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({ category: 'ทั้งหมด', location: 'ทั้งหมด', dateFrom: '', status: 'all' });
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.fromTab === 'found') {
      setActiveTab('found');
    } else if (params.fromTab === 'lost') {
      setActiveTab('lost');
    }
  }, [params.fromTab]);

  useEffect(() => {
  setFilters(prev => ({ ...prev, status: 'all' }));
}, [activeTab]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFAF5' }}>

      {/* HEADER + TOP TAB BAR */}
      <LinearGradient
        colors={['#ffffff', '#ffffff']}
        locations={[0.8, 1]}
        style={{ paddingTop: 70, alignItems: 'center' }}
      >
        <Image
          source={require('../../assets/images/logo_sutfindback.png')}
          style={{ width: 200, height: 80 }}
          resizeMode="contain"
        />

        {/* TOP TAB BAR */}
        <View style={styles.tabBar}>
          <Pressable style={styles.tabItem} onPress={() => setActiveTab('found')}>
            <Text style={[styles.tabLabel, activeTab === 'found' && styles.tabLabelActive]}>
              พบของ
            </Text>
            {activeTab === 'found' && <View style={styles.tabIndicator} />}
          </Pressable>

          <Pressable style={styles.tabItem} onPress={() => setActiveTab('lost')}>
            <Text style={[styles.tabLabel, activeTab === 'lost' && styles.tabLabelActive]}>
              ของหาย
            </Text>
            {activeTab === 'lost' && <View style={styles.tabIndicator} />}
          </Pressable>
        </View>
      </LinearGradient>

      {/* SEARCH BAR */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          placeholder="ค้นหา"
          placeholderTextColor="#999" 
          style={{ flex: 1, marginHorizontal: 10 , color: "#323232" }}
          value={searchQuery}
          onChangeText={setSearchQuery}
          
        />
        <TouchableOpacity onPress={() => setShowFilter(true)}>
          <Ionicons name="options-outline" size={20} color="#999" />
        </TouchableOpacity>
      </View>

       
      {/* CONTENT */}
      {activeTab === 'found' ? <FoundScreen searchQuery={searchQuery} filters={filters} /> : <LostScreen searchQuery={searchQuery} filters={filters} />}
        <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={(f) => setFilters(f)}
        showStatusFilter={activeTab === 'found'}  // แสดงเฉพาะแท็บ found
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
  flexDirection: 'row',
  backgroundColor: 'transparent', // เปลี่ยนตรงนี้
  borderBottomWidth: 1,
  borderBottomColor: '#f0f0f0',
  width: '100%', // ให้ tab bar เต็มความกว้าง
},
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999999',
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
  searchBar: {
    marginHorizontal: 15,
    marginVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 45,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
});