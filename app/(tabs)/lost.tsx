
import { useFocusEffect } from 'expo-router';
import { collection, collectionGroup, getDocs, getFirestore } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { FilterOptions } from '../../components/FilterModal';
import PostCard from '../../components/PostCard';
import { app } from '../../constants/firebase';

export interface LostPost {
  id: string;
  userId: string;
  title: string;
  desc: string;
  detail: string;
  location: string;
  locationName: string;
  locationDetail: string;
  receiveLocation: string;
  user: string;
  username: string;
  date: string;
  createdAt: string;
  images: string[];
  image: { uri: string } | number;
  locationImage: string;
  category: string;
  latitude?: number;
  longitude?: number;
  currentStatus: string;
}


export default function LostScreen({ 
  searchQuery = '', 
  filters = { category: 'ทั้งหมด', location: 'ทั้งหมด', dateFrom: '' } 
}: { 
  searchQuery?: string, 
  filters?: FilterOptions 
}) {
  const [posts, setPosts] = useState<LostPost[]>([]);
   const filteredPosts = posts.filter(post => {
    const matchSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory = filters.category === 'ทั้งหมด' || filters.category === 'อื่น ๆ'
      ? filters.category === 'อื่น ๆ'
        ? !['กระเป๋า / กระเป๋าสตางค์','บัตรนักศึกษา / บัตรประชาชน','โทรศัพท์ / อุปกรณ์อิเล็กทรอนิกส์','เงิน','กุญแจ','เครื่องประดับ','เสื้อผ้า'].includes(post.category)
        : true
      : post.category === filters.category;

    const matchLocation = filters.location === 'ทั้งหมด' || filters.location === 'อื่น ๆ'
      ? filters.location === 'อื่น ๆ'
        ? !['อาคารเรียนรวม 1','อาคารเรียนรวม 2','อาคารเรียนรวม 3','อาคารรัฐสีมาคุณากร','หอพักนักศึกษา','โรงอาหาร'].includes(post.location)
        : true
      : post.location === filters.location;

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

        const colRef = collectionGroup(db, 'lost_posts');
        const snap = await getDocs(colRef);
        const data: LostPost[] = snap.docs.map(docSnap => {
        const d = docSnap.data();
        let uid = '-';
        try {
          const segments = docSnap.ref.path.split('/');
          const usersIdx = segments.indexOf('users');
          if (usersIdx !== -1 && segments.length > usersIdx + 1) {
            uid = segments[usersIdx + 1];
          }
        } catch {}
        const imageArr: string[] = Array.isArray(d.images) ? d.images : [];
        return {
          id: docSnap.id,
          userId: uid,
          title: d.category || d.title || '-',
          desc: d.detail || '-',
          detail: d.detail || '-',
          location: d.location || '-',
          locationName: d.locationName || d.location || '-',
          locationDetail: d.locationDetail || '',
          receiveLocation: d.receiveLocation || '',
          user: userMap[uid] || '-',
          username: userMap[uid] || '-',
          date: d.date || (d.createdAt ? d.createdAt.split('T')[0] : '-'),
          createdAt: d.createdAt || '',
          images: imageArr,
          image: imageArr.length > 0 ? { uri: imageArr[0] } : require('../../assets/images/android-icon-background.png'),
          locationImage: d.locationImage || '',
          category: d.category || '',
          latitude: d.latitude,
          longitude: d.longitude,
          currentStatus: d.status || 'waiting',
        };
      })
      .filter(post => post.currentStatus === 'waiting');

        setPosts(data);
      } catch (e) {
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
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 10 }}
      renderItem={({ item }) => (
        <PostCard
          postId={item.id}
          userId={item.userId}
          type="lost"
          image={item.image}
          images={item.images}
          locationImage={item.locationImage}
          title={item.title}
          detail={item.detail}
          desc={item.desc}
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

const styles = StyleSheet.create({
  card: {
  backgroundColor: '#fff',
  borderRadius: 15,
  margin: 5,
  flex: 1,
  borderColor: '#ffeedc',
  borderWidth: 1,
  

  // iOS
  shadowColor: '#ff863a',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 2,

  // Android
  elevation: 4,
},
  cardInner: {
  borderRadius: 15,
  overflow: 'hidden',
},
  image: {
    width: '100%',
    height: 150,
  },
  cardBody: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5A4633',
  },
  cardDesc: {
    fontSize: 12,
    color: '#777',
    marginVertical: 3,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 5,
    borderColor: '#ffcb98',
    borderWidth: 1,
  },
  locationText: {
    fontSize: 12,
    marginLeft: 5,
    color: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  user: {
    fontSize: 12,
    color: '#999',
  },
  date: {
    fontSize: 12,
    color: '#FBAA58',
  },
});