import { User as FirebaseUser, getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { app } from '../constants/firebase';

// 1. สร้าง type
export interface UserProfile {
  uid: string;
  username: string;
  photoURL: string | null;
}

interface UserContextType {
  user: UserProfile | null;
  setUser: (data: Partial<UserProfile>) => void;
  loading: boolean;
}

// 2. สร้าง context
const UserContext = createContext<UserContextType | undefined>(undefined);

// 3. สร้าง provider
interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // sync user context ทุกครั้งที่ login/logout
  useEffect(() => {
    const auth = getAuth(app);
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const db = getFirestore(app);
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          let username = '';
          if (userDoc.exists() && userDoc.data().username) {
            username = userDoc.data().username;
          } else if (firebaseUser.displayName) {
            username = firebaseUser.displayName;
          } else if (firebaseUser.email) {
            username = firebaseUser.email;
          }
          setUserState({
            uid: firebaseUser.uid,
            username,
            photoURL: userDoc.exists() ? userDoc.data().photoURL || null : null,
          });
        } catch {
          setUserState(null);
        }
      } else {
        setUserState(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ฟังก์ชัน update user ใน context (เช่น หลังลบ/อัปโหลดรูป)
  const updateUser = (data: Partial<UserProfile>) => {
    setUserState((prev) => (prev ? { ...prev, ...data } : prev));
  };

  return (
    <UserContext.Provider value={{ user, setUser: updateUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}

// 4. custom hook
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}
