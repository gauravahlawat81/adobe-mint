import type { Submission, MonthlyEarnings } from '../types';

export const mockSubmissions: Submission[] = [
  {
    id: '1',
    thumbnailUri: 'https://picsum.photos/seed/mint1/200/200',
    title: 'Golden Hour Over Rice Terraces',
    keywords: ['landscape', 'rice', 'terrace', 'golden hour', 'asia', 'agriculture', 'sunset', 'travel'],
    category: 'Nature & Landscapes',
    status: 'approved',
    submittedAt: new Date('2026-03-15'),
    reviewedAt: new Date('2026-03-17'),
    earnings: 24.50,
    downloads: 7,
  },
  {
    id: '2',
    thumbnailUri: 'https://picsum.photos/seed/mint2/200/200',
    title: 'Young Professional Using Smartphone',
    keywords: ['person', 'smartphone', 'professional', 'urban', 'lifestyle', 'technology', 'millennial'],
    category: 'People & Portraits',
    status: 'approved',
    submittedAt: new Date('2026-03-10'),
    reviewedAt: new Date('2026-03-12'),
    earnings: 67.00,
    downloads: 19,
  },
  {
    id: '3',
    thumbnailUri: 'https://picsum.photos/seed/mint3/200/200',
    title: 'Street Food Market at Night',
    keywords: ['food', 'street', 'market', 'night', 'asia', 'culture', 'travel', 'lights', 'vendor'],
    category: 'Food & Drink',
    status: 'reviewing',
    submittedAt: new Date('2026-04-01'),
  },
  {
    id: '4',
    thumbnailUri: 'https://picsum.photos/seed/mint4/200/200',
    title: 'Ancient Temple Architecture Detail',
    keywords: ['temple', 'architecture', 'ancient', 'stone', 'religion', 'asia', 'travel', 'heritage'],
    category: 'Travel & Architecture',
    status: 'approved',
    submittedAt: new Date('2026-02-20'),
    reviewedAt: new Date('2026-02-22'),
    earnings: 41.25,
    downloads: 12,
  },
  {
    id: '5',
    thumbnailUri: 'https://picsum.photos/seed/mint5/200/200',
    title: 'Colorful Street Art Abstract',
    keywords: ['abstract', 'art', 'colorful', 'graffiti', 'urban', 'street', 'creative', 'wall'],
    category: 'Abstract & Textures',
    status: 'pending',
    submittedAt: new Date('2026-04-05'),
  },
  {
    id: '6',
    thumbnailUri: 'https://picsum.photos/seed/mint6/200/200',
    title: 'Fresh Tropical Fruit Arrangement',
    keywords: ['fruit', 'tropical', 'fresh', 'food', 'healthy', 'colorful', 'organic', 'market'],
    category: 'Food & Drink',
    status: 'rejected',
    submittedAt: new Date('2026-03-05'),
    reviewedAt: new Date('2026-03-08'),
  },
  {
    id: '7',
    thumbnailUri: 'https://picsum.photos/seed/mint7/200/200',
    title: 'Morning Yoga by the Ocean',
    keywords: ['yoga', 'ocean', 'morning', 'wellness', 'lifestyle', 'beach', 'meditation', 'healthy', 'woman'],
    category: 'Lifestyle & Wellness',
    status: 'approved',
    submittedAt: new Date('2026-03-28'),
    reviewedAt: new Date('2026-03-30'),
    earnings: 18.75,
    downloads: 5,
  },
];

export const mockMonthlyEarnings: MonthlyEarnings[] = [
  { month: 'Oct', amount: 32.50 },
  { month: 'Nov', amount: 58.00 },
  { month: 'Dec', amount: 91.25 },
  { month: 'Jan', amount: 74.50 },
  { month: 'Feb', amount: 110.00 },
  { month: 'Mar', amount: 151.50 },
];

export const totalEarnings = mockMonthlyEarnings.reduce((sum, m) => sum + m.amount, 0);
export const totalDownloads = mockSubmissions.reduce((sum, s) => sum + (s.downloads ?? 0), 0);
export const approvedCount = mockSubmissions.filter(s => s.status === 'approved').length;
