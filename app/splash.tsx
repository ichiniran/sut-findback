import { Redirect } from 'expo-router';
import SplashArtwork from '../components/SplashArtwork';
import { useUser } from '../components/UserContext';

export default function Splash() {
  const { user, loading } = useUser();
  if (loading) return <SplashArtwork />;
  return <Redirect href={user ? '/(tabs)' : '/login'} />;
}
