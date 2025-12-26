// frontend/src/types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  plan: "starter" | "growth" | "unlimited" | null;

  profiles: UserProfile[];

  templateCount: number;
  postCount: number;

  createdAt: Date;
}

export interface PlatformIntegration {
  id: string;
  userId: string;
  platform: "Instagram" | "TikTok" | "Twitter" | "Facebook";
  username: string;
  fullName: string;
  profilePictureUrl: string;
  followersCount: number;
  followingCount: number;
  bio: string;
  websiteUrl?: string;
  isBusinessAccount: boolean;
}

export interface UserProfile {
  id: string;
  userId: string;

  // Brand Settings (applies to ALL templates for given profile)
  brandSettings: BrandSettings;
  integrations: PlatformIntegration[];

  templateCount: number;
  postCount: number;
  createdAt: Date;
}

export interface BrandSettings {
  name: string; // Profile name (e.g., "Fitness Brand", "Tech Reviews")
  niche: string; // "self improvement"
  aesthetic: string; // "dark and grungy"
  targetAudience: string; // "Gen Z, 18-25"
  brandVoice: string; // "raw, authentic, no BS"
  contentPillars: string[]; // ["confidence", "dating", "fitness"]

  // Writing Style
  toneOfVoice:
    | "casual"
    | "professional"
    | "humorous"
    | "edgy"
    | "inspirational";
  emojiUsage: "none" | "minimal" | "moderate" | "heavy";
  forbiddenWords: string[]; // ["journey", "game-changer"]
  preferredWords: string[]; // ["raw", "real talk", "no cap"]

  // Hashtag Strategy
  // TODO: if they set hashtagCount to 4
  // and provide 1 hashtag, use that one,
  // then generate 3 more based on hashtagStyle
  hashtagStyle: "niche" | "trending" | "mixed";
  hashtagCount: number; // 5-30
  hashtags?: string[]; // if they want set hashtags ["#selflove", "#motivation"]
}
