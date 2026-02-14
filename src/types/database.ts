export type DogSize = 'small' | 'medium' | 'large' | 'extra_large';
export type DogTemperament = 'calm' | 'friendly' | 'energetic' | 'anxious' | 'aggressive';
export type PlayDateStatus = 'scheduled' | 'cancelled' | 'completed';
export type RSVPStatus = 'going' | 'maybe' | 'cancelled';
export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Dog {
  id: string;
  owner_id: string;
  name: string;
  breed: string | null;
  size: DogSize;
  temperament: DogTemperament[];
  age_years: number | null;
  photo_url: string | null;
  notes: string | null;
  color: string | null;
  weight_lbs: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Park {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  image_url: string | null;
  amenities: string[];
  is_fenced: boolean;
  has_water: boolean;
  has_shade: boolean;
  created_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  park_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  profile?: Profile;
  park?: Park;
  dogs?: Dog[];
}

export interface CheckInDog {
  id: string;
  check_in_id: string;
  dog_id: string;
  dog?: Dog;
}

export interface PlayDate {
  id: string;
  organizer_id: string;
  park_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  max_dogs: number | null;
  status: PlayDateStatus;
  created_at: string;
  updated_at: string;
  organizer?: Profile;
  park?: Park;
  rsvps?: PlayDateRSVP[];
}

export interface PlayDateRSVP {
  id: string;
  play_date_id: string;
  user_id: string;
  dog_id: string;
  status: RSVPStatus;
  created_at: string;
  profile?: Profile;
  dog?: Dog;
}

export interface Conversation {
  id: string;
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
  participants?: ConversationParticipant[];
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at: string;
  created_at: string;
  profile?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  created_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  requester?: Profile;
  addressee?: Profile;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      dogs: {
        Row: Dog;
        Insert: Omit<Dog, 'id' | 'created_at' | 'updated_at' | 'is_active'>;
        Update: Partial<Omit<Dog, 'id' | 'owner_id' | 'created_at'>>;
      };
      parks: {
        Row: Park;
        Insert: Omit<Park, 'id' | 'created_at'>;
        Update: Partial<Omit<Park, 'id' | 'created_at'>>;
      };
      check_ins: {
        Row: CheckIn;
        Insert: Omit<CheckIn, 'id' | 'checked_in_at' | 'checked_out_at' | 'profile' | 'dogs'>;
        Update: Partial<Pick<CheckIn, 'checked_out_at'>>;
      };
      check_in_dogs: {
        Row: CheckInDog;
        Insert: Omit<CheckInDog, 'id' | 'dog'>;
        Update: never;
      };
      play_dates: {
        Row: PlayDate;
        Insert: Omit<PlayDate, 'id' | 'created_at' | 'updated_at' | 'status' | 'organizer' | 'park' | 'rsvps'>;
        Update: Partial<Omit<PlayDate, 'id' | 'organizer_id' | 'created_at' | 'organizer' | 'park' | 'rsvps'>>;
      };
      play_date_rsvps: {
        Row: PlayDateRSVP;
        Insert: Omit<PlayDateRSVP, 'id' | 'created_at' | 'profile' | 'dog'>;
        Update: Partial<Pick<PlayDateRSVP, 'status'>>;
      };
      conversations: {
        Row: Conversation;
        Insert: Omit<Conversation, 'id' | 'created_at' | 'last_message_at' | 'last_message_preview' | 'participants'>;
        Update: Partial<Pick<Conversation, 'last_message_at' | 'last_message_preview'>>;
      };
      conversation_participants: {
        Row: ConversationParticipant;
        Insert: Omit<ConversationParticipant, 'id' | 'created_at' | 'last_read_at' | 'profile'>;
        Update: Partial<Pick<ConversationParticipant, 'last_read_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at' | 'sender'>;
        Update: never;
      };
      push_tokens: {
        Row: PushToken;
        Insert: Omit<PushToken, 'id' | 'created_at'>;
        Update: never;
      };
      friendships: {
        Row: Friendship;
        Insert: Omit<Friendship, 'id' | 'created_at' | 'updated_at' | 'status' | 'requester' | 'addressee'>;
        Update: Partial<Pick<Friendship, 'status'>>;
      };
    };
  };
}
