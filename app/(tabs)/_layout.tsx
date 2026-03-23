import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';


type IconName = React.ComponentProps<typeof Ionicons>['name'];


const ICON_SIZE = {
  tab: 25,
  center: 35,
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
  return (
    <View style={styles.barContainer}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const meta = tabMeta[route.name];


          if (!meta) {
            return null;
          }


          const focused = state.index === index;
          const iconName = focused && meta.activeIcon ? meta.activeIcon : meta.icon;
          const tintColor = meta.center ? '#FFFFFF' : focused ? '#5A2F06' : '#FFF7EC';


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


          if (meta.center) {
            return (
              <View key={route.key} style={styles.centerSlot}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={focused ? { selected: true } : {}}
                  accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
                  onLongPress={onLongPress}
                  onPress={onPress}
                  style={styles.centerButton}>
                  <Ionicons name={iconName} size={ICON_SIZE.center} color={tintColor} />
                </Pressable>
                <Text style={styles.centerLabel}>{meta.label}</Text>
              </View>
            );
          }


          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
              onLongPress={onLongPress}
              onPress={onPress}
              style={styles.tabButton}>
              <Ionicons name={iconName} size={ICON_SIZE.tab} color={tintColor} />
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
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="post" options={{ title: 'Post' }} />
      <Tabs.Screen name="notify" options={{ title: 'Notify' }} />
      <Tabs.Screen name="me" options={{ title: 'Me' }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}


const styles = StyleSheet.create({
  barContainer: {
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 0,
    paddingTop: 6,
  },
  bar: {
    height: 98,
    backgroundColor: '#F8C46E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 20,
    paddingHorizontal: 0,
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
    fontSize: 14,
    fontWeight: '500',
  },
  activeLabel: {
    color: '#6B3C10',
  },
  inactiveLabel: {
    color: '#FFF7EC',
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
    backgroundColor: '#F8C46E',
    borderWidth: 6,
    borderColor: '#FFF4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF7EC',
  },
});




