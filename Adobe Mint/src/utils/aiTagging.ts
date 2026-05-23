import * as FileSystem from 'expo-file-system';
import type { Photo, TaggedPhoto, StockCategory } from '../types';
import { OPENAI_API_KEY } from '../config';

const STOCK_CATEGORIES: StockCategory[] = [
  'Nature & Landscapes',
  'People & Portraits',
  'Travel & Architecture',
  'Food & Drink',
  'Technology & Business',
  'Animals & Wildlife',
  'Abstract & Textures',
  'Lifestyle & Wellness',
  'Sports & Action',
  'Arts & Culture',
];

const SCAN_PROMPT = `You are an Adobe Stock expert and buyer. Analyze this photo and decide:

1. Is it commercially valuable for stock photography? Consider:
   - Would brands, media, or AI training companies pay for it?
   - Is it technically good quality (sharp, well-exposed, composed)?
   - Does it show a clear subject with commercial appeal?
   - Reject: blurry, dark, cluttered, selfies with no context, screenshots, memes, casual snapshots.

2. If stock-worthy, generate complete metadata.

Return ONLY raw JSON (no markdown):
{
  "isStockWorthy": boolean,
  "title": string or null,
  "description": string or null,
  "keywords": string[] or null,
  "category": string or null,
  "requiresReview": boolean,
  "reviewReason": string or null
}

Category must be one of: ${STOCK_CATEGORIES.map(c => `"${c}"`).join(', ')}
Title: max 70 chars. Keywords: exactly 15 items. requiresReview true only for nudity, violence, unconsented recognisable people, brand logos.`;

// Returns the tagged photo, null if not stock-worthy, or throws on API error
export async function analyzeForStock(photo: Photo): Promise<TaggedPhoto | null> {
  let base64: string;
  try {
    base64 = await FileSystem.readAsStringAsync(photo.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (e) {
    console.warn('[aiTagging] Failed to read photo file:', photo.uri, e);
    throw new Error('file_read_failed');
  }

  let response: Response;
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'low' },
              },
              { type: 'text', text: SCAN_PROMPT },
            ],
          },
        ],
      }),
    });
  } catch (e) {
    console.error('[aiTagging] Network error calling OpenAI:', e);
    throw new Error('network_error');
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    console.error(`[aiTagging] OpenAI API error ${response.status}:`, errBody);
    throw new Error(`api_error_${response.status}`);
  }

  const json = await response.json();
  const content: string = json.choices?.[0]?.message?.content ?? '';
  console.log('[aiTagging] GPT response:', content.slice(0, 200));

  let parsed: {
    isStockWorthy: boolean;
    title: string | null;
    description: string | null;
    keywords: string[] | null;
    category: string | null;
    requiresReview: boolean;
    reviewReason: string | null;
  };

  try {
    parsed = JSON.parse(content);
  } catch (e) {
    console.warn('[aiTagging] Failed to parse GPT JSON:', content, e);
    throw new Error('parse_error');
  }

  if (!parsed.isStockWorthy) return null;

  const category: StockCategory = STOCK_CATEGORIES.includes(parsed.category as StockCategory)
    ? (parsed.category as StockCategory)
    : 'Nature & Landscapes';

  return {
    photo,
    title:         parsed.title ?? 'Untitled',
    description:   parsed.description ?? '',
    keywords:      Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 15) : [],
    category,
    requiresReview: parsed.requiresReview === true,
    reviewReason:   parsed.reviewReason ?? undefined,
  };
}

// Kept for backward compat
export async function generateAITags(photo: Photo): Promise<TaggedPhoto> {
  const result = await analyzeForStock(photo);
  if (result) return result;
  return {
    photo,
    title: 'Photo',
    description: '',
    keywords: [],
    category: 'Nature & Landscapes',
    requiresReview: false,
  };
}

// Run analyzeForStock on a batch with limited concurrency
// onProgress receives: scanned, total, found, errors
export async function scanCameraRoll(
  photos: Photo[],
  onProgress: (scanned: number, total: number, found: number, errors: number) => void
): Promise<TaggedPhoto[]> {
  const CONCURRENCY = 3;
  const results: TaggedPhoto[] = [];
  let scanned = 0;
  let errors = 0;

  for (let i = 0; i < photos.length; i += CONCURRENCY) {
    const batch = photos.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async p => {
        try {
          return await analyzeForStock(p);
        } catch {
          // Retry once after a short delay
          try {
            await new Promise(r => setTimeout(r, 1000));
            return await analyzeForStock(p);
          } catch {
            errors++;
            return null;
          }
        }
      })
    );
    batchResults.forEach(r => { if (r) results.push(r); });
    scanned += batch.length;
    onProgress(scanned, photos.length, results.length, errors);
  }

  return results;
}
