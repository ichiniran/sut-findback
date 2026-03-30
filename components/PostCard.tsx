import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface PostCardProps {
  postId?: string;
  userId?: string;
  type?: 'found' | 'lost';
  image: { uri: string } | number;
  images?: string[];
  locationImage?: string;   // รูปจุดฝาก
  title: string;
  detail?: string;
  desc?: string;
  location?: string;
  locationName?: string;
  locationDetail?: string;
  receiveLocation?: string;
  user?: string;
  username?: string;
  date?: string;
  createdAt?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  currentStatus?: string;
}

export default function PostCard(props: PostCardProps) {
  const {
    postId, userId, type = 'found',
    image, images, locationImage,
    title, detail, desc,
    location, locationName, locationDetail, receiveLocation,
    user, username, date, createdAt,
    category, latitude, longitude, currentStatus,
  } = props;

  const router = useRouter();

  const thumbUri =
    images && images.length > 0
      ? images[0]
      : typeof image === 'object' && 'uri' in image
      ? image.uri
      : null;

  const handlePress = () => {
    router.push({
      pathname: '/post-detail',
      params: {
        postId: postId || '',
        userId: userId || '',
        type,
        title: title || '',
        detail: detail || desc || '',
        location: location || '',
        locationName: locationName || location || '',
        locationDetail: locationDetail || '',
        receiveLocation: receiveLocation || '',
        username: username || user || '',
        user: user || '',
        date: date || '',
        createdAt: createdAt || '',
        images: images && images.length > 0 ? JSON.stringify(images) : '',
        imageUri: thumbUri || '',
        locationImage: locationImage || '',   // ส่งรูปจุดฝาก
        category: category || '',
        latitude: latitude != null ? String(latitude) : '',
        longitude: longitude != null ? String(longitude) : '',
        currentStatus: currentStatus || '',
      },
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.88}>
      <View style={styles.cardInner}>
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <Image source={image as number} style={styles.image} resizeMode="cover" />
        )}

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
          {(desc || detail) ? (
            <Text style={styles.cardDesc} numberOfLines={2}>{desc || detail}</Text>
          ) : null}

          {(locationName || location) ? (
            <LinearGradient
              colors={['#FFBB6B', '#F97316']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.location}
            >
              <Ionicons name="location-outline" size={12} color="#fff" />
              <Text style={styles.locationText} numberOfLines={1}>
                {locationName || location}
              </Text>
            </LinearGradient>
          ) : null}

          <View style={styles.footer}>
            <Text style={styles.user} numberOfLines={1}>{username || user || '-'}</Text>
            <Text style={styles.date}>{date || '-'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 15,
    margin: 5, width: '48%',
    borderColor: '#ffeedc', borderWidth: 1,
    shadowColor: '#ff863a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 4,
  },
  cardInner: { borderRadius: 15, overflow: 'hidden' },
  image: { width: '100%', height: 150 },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#5A4633' },
  cardDesc: { fontSize: 12, color: '#777', marginVertical: 3 },
  location: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, marginTop: 5,
  },
  locationText: { fontSize: 12, marginLeft: 4, color: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  user: { fontSize: 12, color: '#999', flex: 1, marginRight: 4 },
  date: { fontSize: 12, color: '#FBAA58' },
});