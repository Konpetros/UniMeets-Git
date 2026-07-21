export interface Profile {
  uid: string;
  username: string;
  university: string;
  bio?: string;
  avatar_url?: string;
  interests: string[];
  onboarding_completed: boolean;
}

export type CategoryType = 'movies' | 'coffee' | 'study' | 'walk' | 'party' | 'gaming' | 'sports' | 'music';

export interface UniMeet {
  id: string;
  title: string;
  category: CategoryType;
  creator_id: string;
  creator_username: string;
  creator_avatar: string;
  creator_university: string;
  latitude: number;
  longitude: number;
  geohash: string;
  expires_at: any; // Firestore Timestamp
  status: 'active' | 'expired';
  participant_ids: string[];
  created_at: any; // Firestore Timestamp
}

export type Language = 'el' | 'en';
