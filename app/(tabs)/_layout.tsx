import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { app } from '@/constants/firebase';
import { getAuth } from 'firebase/auth';
import { collection, getFirestore, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ICON_SIZE = {
  tab: 24,
  center: 32,
};

const CENTER_BUTTON_SIZE = 78;

const tabMeta: Record<string, { label: string; icon: IconName; activeIcon?: IconName; center?: boolean }> = {
  index: { label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  chat: { label: 'Chat', icon: 'chatbubble-ellipses-outline', activeIcon: 'chatbubble-ellipses' },
  post: { label: 'Post', icon: 'add', center: true },
  notify: { label: 'Notify', icon: 'notifications-outline', activeIcon: 'notifications' },
  me: { label: 'Me', icon: 'person-outline', activeIcon: 'person' },
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {

  // 🔴 BADGE STATE
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [hasUnreadNotify, setHasUnreadNotify] = useState(false);

  // 🔥 REALTIME FIRESTORE
  useEffect(() => {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore(app);

    // 🔥 CHAT unread
    const chatQ = query(
      collection(db, 'chats'),
      where('receiverId', '==', user.uid),
      where('isRead', '==', false)
    );

    const unsubChat = onSnapshot(chatQ, (snap) => {
      setHasUnreadChat(!snap.empty);
    });

    // 🔥 NOTIFY unread
    const notifyQ = query(
      collection(db, 'users', user.uid, 'notifications'),
      where('isRead', '==', false)
    );

    const unsubNotify = onSnapshot(notifyQ, (snap) => {
      setHasUnreadNotify(!snap.empty);
    });

    return () => {
      unsubChat();
      unsubNotify();
    };
  }, []);

  return (
    <View style={styles.barContainer}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const meta = tabMeta[route.name];
          if (!meta) return null;

          const focused = state.index === index;
          const iconName = focused && meta.activeIcon ? meta.activeIcon : meta.icon;

          const tintColor = meta.center
            ? '#ffffff'
            : focused
            ? '#5a5a5a'
            : '#aaaaaa';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // 🔥 CENTER BUTTON
          if (meta.center) {
            return (
              <View key={route.key} style={styles.centerSlot}>
                <Pressable
                  onLongPress={onLongPress}
                  onPress={onPress}
                  style={styles.centerButton}
                >
                  <Ionicons name={iconName} size={ICON_SIZE.center} color={tintColor} />
                </Pressable>
                <Text style={styles.centerLabel}>{meta.label}</Text>
              </View>
            );
          }

          // 🔥 NORMAL TAB + BADGE
          return (
            <Pressable
              key={route.key}
              onLongPress={onLongPress}
              onPress={onPress}
              style={styles.tabButton}
            >
              <View style={{ position: 'relative' }}>
                <Ionicons name={iconName} size={ICON_SIZE.tab} color={tintColor} />

                {/* 🔴 BADGE */}
                {(route.name === 'chat' && hasUnreadChat) ||
                 (route.name === 'notify' && hasUnreadNotify) ? (
                  <View style={styles.badgeDot} />
                ) : null}
              </View>

              <Text style={[styles.tabLabel, focused ? styles.activeLabel : styles.inactiveLabel]}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="post" />
      <Tabs.Screen name="notify" />
      <Tabs.Screen name="me" />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    backgroundColor: '#FFFAF5',
    paddingTop: 6,
  },

  bar: {
    height: 90,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 20,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingBottom: 4,
  },

  tabLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    fontWeight: '500',
  },

  activeLabel: {
    color: '#5a5a5a',
  },

  inactiveLabel: {
    color: '#aaaaaa',
  },

  centerSlot: {
    width: CENTER_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -38,
  },

  centerButton: {
    width: CENTER_BUTTON_SIZE,
    height: CENTER_BUTTON_SIZE,
    borderRadius: CENTER_BUTTON_SIZE / 2,
    backgroundColor: '#F97316',
    borderWidth: 4,
    borderColor: '#FFFAF5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  centerLabel: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#F97316',
  },

  // 🔴 BADGE
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: '#EF4444',
  },
});