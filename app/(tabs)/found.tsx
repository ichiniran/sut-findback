import { useFocusEffect } from 'expo-router';
import { collection, collectionGroup, getDocs, getFirestore } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { FlatList } from 'react-native';
import { FilterOptions } from '../../components/FilterModal';
import PostCard from '../../components/PostCard';
import { app } from '../../constants/firebase';

export interface FoundPost {
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
  locationImage: string;   // รูปจุดฝาก
  category: string;
  latitude?: number;
  longitude?: number;
  currentStatus: string;
}

const PLACEHOLDER = require('../../assets/images/android-icon-background.png');

export default function FoundScreen({ searchQuery = '', filters = { category: 'ทั้งหมด', location: 'ทั้งหมด', dateFrom: '' } }: { searchQuery?: string; filters: FilterOptions }) {
  const [posts, setPosts] = useState<FoundPost[]>([]);
   const filteredPosts = posts.filter(post => {
    const matchSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.locationName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory = filters.category === 'ทั้งหมด' || filters.category === 'อื่น ๆ'
      ? filters.category === 'อื่น ๆ'
        ? !['กระเป๋า / กระเป๋าสตางค์','บัตรนักศึกษา / บัตรประชาชน','โทรศัพท์ / อุปกรณ์อิเล็กทรอนิกส์','เงิน','กุญแจ','เครื่องประดับ','เสื้อผ้า'].includes(post.category)
        : true
      : post.category === filters.category;

    const matchLocation = filters.location === 'ทั้งหมด' || filters.location === 'อื่น ๆ'
      ? filters.location === 'อื่น ๆ'
        ? !['อาคารเรียนรวม 1','อาคารเรียนรวม 2','อาคารเรียนรวม 3','อาคารรัฐสีมาคุณากร','หอพักนักศึกษา','โรงอาหาร'].includes(post.locationName)
        : true
      : post.locationName === filters.location;

    return matchSearch && matchCategory && matchLocation;
  });
  useFocusEffect(
  useCallback(() => {
    const fetchPosts = async () => {
      try {
        const db = getFirestore(app);
        
        const usersSnap = await getDocs(collection(db, 'users'));
        const userMap: Record<string, string> = {};
        usersSnap.forEach(doc => {
          const d = doc.data();
          userMap[doc.id] = d.username || d.email || '-';
        });

        const snap = await getDocs(collectionGroup(db, 'found_posts'));

        const data: FoundPost[] = snap.docs.map(docSnap => {
          const d = docSnap.data();

          let uid = '-';
          const segments = docSnap.ref.path.split('/');
          const usersIdx = segments.indexOf('users');
          if (usersIdx !== -1 && segments.length > usersIdx + 1) {
            uid = segments[usersIdx + 1];
          }

          const imageArr: string[] = Array.isArray(d.images) ? d.images : [];

          return {
            id: docSnap.id,
            userId: uid,
            title: d.category || d.title || '-',
            detail: d.detail || '-',
            location: d.location || '-',
            locationName: d.locationName || d.location || '-',
            locationDetail: d.locationDetail || '',
            receiveLocation: d.receiveLocation || '',
            username: userMap[uid] || '-',
            date: d.date || (d.createdAt ? d.createdAt.split('T')[0] : '-'),
            createdAt: d.createdAt || '',
            images: imageArr,
            image: imageArr.length > 0 ? { uri: imageArr[0] } : PLACEHOLDER,
            locationImage: d.locationImage || '',
            category: d.category || '',
            latitude: d.latitude,
            longitude: d.longitude,
            currentStatus: d.status || 'waiting',
          };
        })
        .filter(post => post.currentStatus === 'waiting');

        setPosts(data);
      } catch {
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
          locationImage={item.locationImage}
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