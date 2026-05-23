import type * as MediaLibrary from 'expo-media-library';

export type Photo = MediaLibrary.Asset;

export type StockCategory =
  | 'Nature & Landscapes'
  | 'People & Portraits'
  | 'Travel & Architecture'
  | 'Food & Drink'
  | 'Technology & Business'
  | 'Animals & Wildlife'
  | 'Abstract & Textures'
  | 'Lifestyle & Wellness'
  | 'Sports & Action'
  | 'Arts & Culture';

export type SubmissionStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';

export interface TaggedPhoto {
  photo: Photo;
  title: string;
  description: string;
  keywords: string[];
  category: StockCategory;
  requiresReview: boolean;
  reviewReason?: string;
}

export interface Submission {
  id: string;
  thumbnailUri: string;
  title: string;
  keywords: string[];
  category: StockCategory;
  status: SubmissionStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  earnings?: number;
  downloads?: number;
}

export interface MonthlyEarnings {
  month: string;
  amount: number;
}

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  Tagging: { photos: Photo[] };
  UploadSuccess: { count: number; flaggedCount: number };
};

export type TabParamList = {
  Home: undefined;
  Earnings: undefined;
  Profile: undefined;
};
