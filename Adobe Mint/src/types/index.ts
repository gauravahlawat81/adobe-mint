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

export type SubmissionStatus = 'submitted' | 'reviewing' | 'approved' | 'rejected';

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

export type SubmissionDetailParams = {
  id: string;
  thumbnailUri: string;
  title: string;
  description?: string;
  keywords: string[];
  category: string;
  status: SubmissionStatus;
  requiresReview: boolean;
  reviewReason?: string | null;
  submittedAt: string;
  earnings: number;
  downloads: number;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  Tagging: { photos: Photo[] };
  UploadSuccess: { count: number; flaggedCount: number };
  SubmissionDetail: { submission: SubmissionDetailParams };
};

export type TabParamList = {
  Home: undefined;
  Earnings: undefined;
  Settings: undefined;
};
