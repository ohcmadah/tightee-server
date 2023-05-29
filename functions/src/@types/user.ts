export interface AuthUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  provider?: string;
}

interface KakaoProfile {
  nickname?: string;
  thumbnail_image_url?: string;
  profile_image_url?: string;
  is_default_image?: boolean;
}

interface KakaoAccount {
  profile?: KakaoProfile;
  name?: string;
  email?: string;
  birthday?: string;
  gender?: "male" | "female";
}

export interface KakaoUser {
  id: number;
  kakao_account?: KakaoAccount;
}

export interface NormalizedUser {
  id: string;
  provider: string;
  nickname?: string;
  email?: string;
  birthday?: string;
  gender?: string;
}

export type MBTI =
  | "ISTJ"
  | "ISFJ"
  | "INFJ"
  | "INTJ"
  | "ISTP"
  | "ISFP"
  | "INFP"
  | "INTP"
  | "ESTP"
  | "ESFP"
  | "ENFP"
  | "ENTP"
  | "ESTJ"
  | "ESFJ"
  | "ENFJ"
  | "ENTJ"
  | null;

export interface TighteeUser {
  id: string;
  email: string | null;
  nickname: string;
  region: string;
  birthdate: number;
  gender: string;
  MBTI: MBTI;
  subscribe: {
    marketing: boolean;
  };
}
