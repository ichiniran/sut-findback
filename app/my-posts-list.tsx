import { useFocusEffect } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, getFirestore, orderBy, query, where } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { FlatList } from 'react-native';
import PostCard from '../components/PostCard';
import { app } from '../constants/firebase';

export interface Post {
  id: string;
  userId: string;
  title: string;
  desc: string;
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

const PLACEHOLDER = require('../assets/images/noimage.png');

export default function MyPostsList({ type }: { type: 'found' | 'lost' }) {
  const [posts, setPosts] = useState<Post[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchPosts = async () => {
        try {
          const auth = getAuth(app);
          const user = auth.currentUser;
          if (!user) return;

          const db = getFirestore(app);

          // ✅ flat collection — query by userId + type
          const snap = await getDocs(
            query(
              collection(db, 'posts'),
              where('userId', '==', user.uid),
              where('type', '==', type),
              orderBy('createdAt', 'desc'),
            )
          );

          const data: Post[] = snap.docs.map(docSnap => {
            const d = docSnap.data();
            const imageArr: string[] = Array.isArray(d.images) ? d.images : [];
            return {
              id: docSnap.id,
              userId: d.userId || user.uid,
              title: d.category || '-',
              desc: d.detail || '-',
              detail: d.detail || '-',
              location: d.location || '-',
              locationName: d.locationName || d.location || '-',
              locationDetail: d.locationDetail || '',
              receiveLocation: d.receiveLocation || '',
              username: d.username || '-',
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
          console.log('FIRESTORE ERROR myposts:', e)
          setPosts([]);
        }
      };

      fetchPosts();
    }, [type])
  );

  return (
    <FlatList
      data={posts}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      keyExtractor={item => item.id}
      contentContainerStyle={{ paddingHorizontal: 10 }}
      renderItem={({ item }) => (
        <PostCard
          postId={item.id}
          userId={item.userId}
          type={type}
          image={item.image}
          images={item.images}
          receiveLocationImage={item.receiveLocationImage}
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
