import { useFocusEffect } from 'expo-router';
import { collection, getDocs, getFirestore, orderBy, query, where } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { FlatList } from 'react-native';
import { FilterOptions } from '../../components/FilterModal';
import PostCard from '../../components/PostCard';
import { app } from '../../constants/firebase';

export interface Post {
  id: string;
  userId: string;
  title: string;
  detail: string;
  location: string;
  locationName: string;
  locationDetail: string;
  receiveLocation: string;
  username: string;
  date: string;
  createdAt: string;
  images: string[];
  image: { uri: string } | number;
  receiveLocationImage: string;
  category: string;
  latitude?: number;
  longitude?: number;
  currentStatus: string;
}

const PLACEHOLDER = require('../../assets/images/noimage.png');

const STANDARD_CATEGORIES = [
  'กระเป๋า / กระเป๋าสตางค์', 'บัตรนักศึกษา / บัตรประชาชน',
  'โทรศัพท์ / อุปกรณ์อิเล็กทรอนิกส์', 'เงิน', 'กุญแจ', 'เครื่องประดับ', 'เสื้อผ้า',
];
const STANDARD_LOCATIONS = [
  'อาคารเรียนรวม 1', 'อาคารเรียนรวม 2', 'อาคารเรียนรวม 3',
  'อาคารรัฐสีมาคุณากร', 'หอพักนักศึกษา', 'โรงอาหาร',
];

export default function FoundScreen({
  searchQuery = '',
  filters = { category: 'ทั้งหมด', location: 'ทั้งหมด', dateFrom: '', status: 'all' },
}: {
  searchQuery?: string;
  filters: FilterOptions;
}) {
  const [posts, setPosts] = useState<Post[]>([]);

  const filteredPosts = posts.filter(post => {
  const matchSearch =
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.locationName.toLowerCase().includes(searchQuery.toLowerCase());

  const matchCategory =
    filters.category === 'ทั้งหมด' ? true
    : filters.category === 'อื่น ๆ' ? !STANDARD_CATEGORIES.includes(post.category)
    : post.category === filters.category;

  const matchLocation =
    filters.location === 'ทั้งหมด' ? true
    : filters.location === 'อื่น ๆ' ? !STANDARD_LOCATIONS.includes(post.locationName)
    : post.locationName === filters.location;

  // ── เพิ่มตรงนี้ ──
  const matchStatus =
    !filters.status || filters.status === 'all'
      ? post.currentStatus !== 'rejected'
      : post.currentStatus === filters.status;

  return matchSearch && matchCategory && matchLocation && matchStatus;
});

  useFocusEffect(
    useCallback(() => {
      const fetchPosts = async () => {
        try {
          const db = getFirestore(app);

          // flat collection
          const snap = await getDocs(
            query(
              collection(db, 'posts'),
              where('type', '==', 'found'),
              //where('status', '==', 'waiting'),
              orderBy('createdAt', 'desc'),
            )
          );

          const data: Post[] = snap.docs.map(docSnap => {
            const d = docSnap.data();
            const imageArr: string[] = Array.isArray(d.images) ? d.images : [];
            return {
              id: docSnap.id,
              userId: d.userId || '-',
              title: d.category || '-',
              detail: d.detail || '-',
              location: d.location || '-',
              locationName: d.locationName || d.location || '-',
              locationDetail: d.locationDetail || '',
              receiveLocation: d.receiveLocation || '',
              username: d.username || '-',   // denormalized ไม่ต้อง fetch แยก
              date: d.date || (d.createdAt ? d.createdAt.split('T')[0] : '-'),
              createdAt: d.createdAt || '',
              images: imageArr,
              image: imageArr.length > 0 ? { uri: imageArr[0] } : PLACEHOLDER,
              receiveLocationImage: d.receiveLocationImage || '',
              category: d.category || '',
              latitude: d.latitude,
              longitude: d.longitude,
              currentStatus: d.status || 'waiting',
            };
          });

          setPosts(data);
        } catch (e) {
          console.log('FIRESTORE ERROR found:', e)
          setPosts([]);
        }
      };

      fetchPosts();
    }, [])
  );

  return (
    <FlatList
      data={filteredPosts}
      numColumns={2}
      keyExtractor={item => item.id}
      contentContainerStyle={{ paddingHorizontal: 10 }}
      renderItem={({ item }) => (
        <PostCard
          postId={item.id}
          userId={item.userId}
          type="found"
          image={item.image}
          images={item.images}
          receiveLocationImage={item.receiveLocationImage}
          title={item.title}
          detail={item.detail}
          location={item.location}
          locationName={item.locationName}
          locationDetail={item.locationDetail}
          receiveLocation={item.receiveLocation}
          username={item.username}
          date={item.date}
          createdAt={item.createdAt}
          category={item.category}
          latitude={item.latitude}
          longitude={item.longitude}
          currentStatus={item.currentStatus}
        />
      )}
    />
  );
}
