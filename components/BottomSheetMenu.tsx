import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
    Animated,
    PanResponder,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";


function MenuItem({ icon, label, danger, onPress }: any) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Ionicons name={icon} size={22} color={danger ? "red" : "#333"} />
      <Text style={[styles.text, danger && { color: "red" }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function BottomSheetMenu({
  visible,
  onClose,
  isOwner,
  onSave,
  onEdit,
  onDelete,
  onReport,
  isSaved,
  onShare,
}: any) {
  const translateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const close = () => {
    Animated.timing(translateY, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(onClose);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 10,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100) close();
        else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <>
      {visible && (
        <>
          {/* overlay */}
          <Pressable style={styles.overlay} onPress={close} />

          {/* sheet */}
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY }] }]}
            {...panResponder.panHandlers}
          >
            <View style={styles.dragBar} />
           
            <MenuItem
              icon={isSaved ? "bookmark" : "bookmark-outline"}  
              label={isSaved ? "Unsave" : "Save"}               
              onPress={() => {
                onSave?.();
                close();
              }}
            />

            {isOwner && (
              <>
                <MenuItem
                  icon="create-outline"
                  label="Edit"
                  onPress={() => {
                    onEdit?.();
                    close();
                  }}
                />
                <MenuItem
                  icon="trash-outline"
                  label="Delete"
                  danger
                  onPress={() => {
                    onDelete?.();
                    close();
                  }}
                />
              </>
            )}

            {!isOwner && (
              <MenuItem
                icon="flag-outline"
                label="Report"
                onPress={() => {
                  onReport?.();
                  close();
                }}
              />
            )}
          </Animated.View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  dragBar: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  text: {
    fontSize: 16,
  },
});