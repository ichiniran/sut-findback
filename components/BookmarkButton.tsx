
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { deleteDoc, doc, getFirestore, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { app } from '../constants/firebase';

interface BookmarkButtonProps {
  postId?: string;
  type?: string;
  postData?: Record<string, any>;
}

export default function BookmarkButton({ postId, type, postData }: BookmarkButtonProps) {
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isFound = type === 'found';
  // Debug log for type and postId
  console.log('[BookmarkButton] type:', type, 'postId:', postId);

  useEffect(() => {
    const checkSaved = async () => {
      console.log('[BookmarkButton] checkSaved', { type, postId });
      try {
        const auth = getAuth(app);
        const user = auth.currentUser;
        if (!user || !postId) {
          console.log('[BookmarkButton] No user or postId', { user, postId });
          setSaved(false);
          return;
        }
        const db = getFirestore(app);
        const saveType = isFound ? 'saved_found' : 'saved_lost';
        const ref = doc(db, 'users', user.uid, saveType, postId);
        const snap = await (await import('firebase/firestore')).getDoc(ref);
        setSaved(snap.exists());
        console.log('[BookmarkButton] snap.exists:', snap.exists());
      } catch (err) {
        setSaved(false);
        console.log('[BookmarkButton] checkSaved error', err);
      }
    };
    checkSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, type]);

  const handleBookmark = async () => {
    setIsSaving(true);
    try {
      console.log('[BookmarkButton] handleBookmark', { type, postId, postData });
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user) {
        console.log('[BookmarkButton] No user logged in');
        Alert.alert('กรุณาเข้าสู่ระบบก่อนบันทึกโพสต์');
        setIsSaving(false);
        return;
      }
      const db = getFirestore(app);
      const saveType = isFound ? 'saved_found' : 'saved_lost';
      const ref = doc(db, 'users', user.uid, saveType, postId!);
      if (!saved) {
        console.log('[BookmarkButton] Saving to', saveType);
        await setDoc(
          ref,
          {
            ...postData,
            savedAt: new Date().toISOString(),
            user: user.uid,
          },
          { merge: true }
        );
        setSaved(true);
        console.log('[BookmarkButton] Saved success');
      } else {
        await deleteDoc(ref);
        setSaved(false);
        console.log('[BookmarkButton] Unsave success');
      }
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาดในการบันทึกโพสต์');
      console.log('[BookmarkButton] handleBookmark error', e);
    }
    setIsSaving(false);
  };

  return (
    <TouchableOpacity style={styles.bookmarkBtn} onPress={handleBookmark} disabled={isSaving}>
      <Ionicons
        name={saved ? 'bookmark' : 'bookmark-outline'}
        size={22}
        color={'#F97316'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bookmarkBtn: {
    marginLeft: 8,
    padding: 6,
  },
});
