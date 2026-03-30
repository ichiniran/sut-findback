import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NotifyScreen() {

  // 🔥 MOCK DATA (พร้อมใช้จริง)
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'มีการรับของแล้ว',
      desc: 'โพสต์นี้ของคุณมีคนมารับไปแล้ว',
      avatar: 'https://i.pravatar.cc/100',
      itemImage: 'https://picsum.photos/100',
      isRead: false,
      createdAt: Date.now(),
    },
    {
      id: '2',
      title: 'มีคนพบของคุณ',
      desc: 'มีผู้ใช้แจ้งว่าพบของที่คุณทำหาย',
      avatar: 'https://i.pravatar.cc/101',
      itemImage: 'https://picsum.photos/101',
      isRead: true,
      createdAt: Date.now() - 10000,
    },
  ]);

  // 🔥 กดแล้ว mark as read
      const handlePress = (id: string) => {
      setNotifications(prev =>
        prev.map(item =>
          item.id === id ? { ...item, isRead: true } : item
        )
      );
    };
  return (
    <View style={styles.container}>

      {/* HEADER */}
      <LinearGradient
        colors={['#FFFAF5', '#FFFAF5']}
        locations={[0.5, 1]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>การแจ้งเตือน</Text>
      </LinearGradient>

      {/* LIST */}
      <FlatList
        data={notifications.sort((a, b) => b.createdAt - a.createdAt)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          
          <TouchableOpacity
            style={[
              styles.item,
              !item.isRead && styles.unreadItem // 👈 unread สีต่าง
            ]}
            onPress={() => handlePress(item.id)}
          >

            {/* Avatar */}
            <Image source={{ uri: item.avatar }} style={styles.avatar} />

            {/* Text */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
            </View>

            {/* Image ขวา */}
            <Image source={{ uri: item.itemImage }} style={styles.itemImage} />

            {/* 🔴 จุด unread */}
            {!item.isRead && <View style={styles.dot} />}

          </TouchableOpacity>

        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFAF5',
  },

  header: {
    paddingTop: 70,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#5A4633',
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D6CC',
    backgroundColor: '#fff',
  },

  unreadItem: {
    backgroundColor: '#FFF3E6', // 👈 unread สีอ่อน
  },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: 50,
    marginRight: 12,
  },

  textContainer: {
    flex: 1,
  },

  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5A4633',
  },

  desc: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },

  itemImage: {
    width: 45,
    height: 45,
    borderRadius: 8,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: '#FBAA58',
    position: 'absolute',
    right: 10,
    top: 10,
  },
});