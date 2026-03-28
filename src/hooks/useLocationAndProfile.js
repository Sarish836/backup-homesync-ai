import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useLocationAndProfile() {
  const [location, setLocation] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get GPS coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation(null)
      );
    }

    // Load user profile
    base44.entities.UserProfile.list().then(profiles => {
      if (profiles.length > 0) setProfile(profiles[0]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const saveProfile = async (data) => {
    if (profile) {
      const updated = await base44.entities.UserProfile.update(profile.id, data);
      setProfile(updated);
      return updated;
    } else {
      const created = await base44.entities.UserProfile.create(data);
      setProfile(created);
      return created;
    }
  };

  return { location, profile, loading, saveProfile };
}