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

const SCAN_PROMPT = `You are a maximally inclusive Adobe Stock curator. Your mission is to unlock the commercial value in everyday photos taken by regular people on their phones.

WHO IS BUYING THESE PHOTOS:
- AI training companies need massive volumes of real-world, diverse, authentic images — technical quality barely matters, content variety is everything
- Local content creators need hyper-local photos: specific streets, foods, faces, neighborhoods, markets — a blurry photo of a local market is still valuable
- Bloggers, small businesses, social media managers need authentic non-stock-looking photos
- Researchers and journalists need real documentation, not polished photography

APPROVAL PHILOSOPHY — be extremely generous:
- IGNORE: resolution, sharpness, grain, noise, exposure issues, composition rules
- IGNORE: whether it looks "professional" — amateur authenticity is a feature, not a bug
- IGNORE: lighting quality, color accuracy, camera shake, slight blur
- APPROVE anything that shows a real subject, place, object, person, food, animal, texture, or scene
- A grainy photo of a street vendor is more valuable than a perfect studio shot to the right buyer
- When in doubt, ALWAYS APPROVE

ONLY hard-reject (truly unsalvageable):
- Completely black or completely white frames with no discernible content
- Screenshots of apps, UIs, or text messages
- Memes or images with overlaid text/stickers
- Explicit sexual content

2. If approving, generate metadata optimized for diverse buyer discovery.

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

  const requestBody = {
    model: 'gpt-4o-mini',
    max_tokens: 300,
    messages: [
      {
        role: 'system',
        content: SCAN_PROMPT,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'low' },
          },
          { type: 'text', text: 'Analyze this photo.' },
        ],
      },
    ],
  };

  // 🔍 DEBUG — log the full prompt being sent (remove before shipping)
  console.log('[aiTagging] REQUEST BODY →', JSON.stringify({
    ...requestBody,
    messages: requestBody.messages.map(m => ({
      ...m,
      content: Array.isArray(m.content)
        ? m.content.map(c => c.type === 'image_url'
            ? { type: 'image_url', url: '[base64 image omitted]' }
            : c)
        : m.content,
    })),
  }, null, 2));

  let response: Response;
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
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

// Run analyzeForStock on a batch with limited concurrency.
// onPhotoFound is called immediately each time a worthy photo is found — don't wait for the batch.
// onProgress receives: scanned, total, found, errors
export async function scanCameraRoll(
  photos: Photo[],
  onProgress: (scanned: number, total: number, found: number, errors: number) => void,
  onPhotoFound?: (photo: TaggedPhoto) => void,
): Promise<TaggedPhoto[]> {
  const CONCURRENCY = 6;
  const results: TaggedPhoto[] = [];
  let scanned = 0;
  let errors = 0;

  for (let i = 0; i < photos.length; i += CONCURRENCY) {
    const batch = photos.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async p => {
        let result: TaggedPhoto | null = null;
        try {
          result = await analyzeForStock(p);
        } catch {
          try {
            await new Promise(r => setTimeout(r, 1000));
            result = await analyzeForStock(p);
          } catch {
            errors++;
          }
        }
        scanned++;
        if (result) {
          results.push(result);
          onPhotoFound?.(result); // ← stream immediately, don't wait for batch
        }
        onProgress(scanned, photos.length, results.length, errors);
      })
    );
  }

  return results;
}
