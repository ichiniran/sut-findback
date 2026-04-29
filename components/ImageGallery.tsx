import { useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
export default function ImageGallery({ images }: { images: string[] }) {
  const [imgIdx, setImgIdx] = useState(0);
  const screenWidth = Dimensions.get('window').width;

  if (images.length === 0) {
    return (
      <View style={styles.imagePlaceholder}>
        <Ionicons name="image-outline" size={48} color="rgba(63,63,63,0.4)" />
        <Text style={styles.noImageText}>ไม่มีรูปภาพ</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onScroll={e => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / screenWidth))}
        scrollEventThrottle={16}
      >
        {images.map((uri, idx) => (
          <Image key={idx} source={{ uri }} style={{ width: screenWidth, height: 350 }} resizeMode="cover" />
        ))}
      </ScrollView>
      {images.length > 1 && (
        <>
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, i === imgIdx && styles.dotActive]} />
            ))}
          </View>
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>{imgIdx + 1}/{images.length}</Text>
          </View>
        </>
      )}
    </>
  );
}
const styles = StyleSheet.create({
  imagePlaceholder: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#f0f0f0' 
  },
  noImageText: { 
    color: 'rgba(33, 26, 26, 0.52)', 
    marginTop: 8, 
    fontSize: 13 
  },
  dots: {
    position: 'absolute', bottom: 12,
    left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: { 
    width: 6, height: 6, borderRadius: 3, 
    backgroundColor: 'rgba(255,255,255,0.4)' 
  },
  dotActive: { width: 18, backgroundColor: '#fff' },
  imageCounter: {
    position: 'absolute', bottom: 12, right: 14,
    backgroundColor: 'rgba(0,0,0,0.45)', 
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
  },
  imageCounterText: { color: '#fff', fontSize: 11 },
});