import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export async function requestAndGetLocation(): Promise<{ latitude: number; longitude: number }> {
  if (Capacitor.isNativePlatform()) {
    // Request permission on native (Android/iOS)
    const permStatus = await Geolocation.checkPermissions();
    if (permStatus.location !== 'granted') {
      const req = await Geolocation.requestPermissions();
      if (req.location !== 'granted') {
        throw new Error('Location permission denied');
      }
    }
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } else {
    // Web fallback
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }
}
