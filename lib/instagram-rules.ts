export type InstagramPost = {
  id: string;
  username: string;
  permalink: string;
  mediaType: string;
  mediaProductType?: string;
  caption: string;
  timestamp: string;
};
export type WorkRole = 'Filming' | 'Editing' | 'Film project';
export type PostDecision = { decision: 'include' | 'review' | 'exclude'; roles: WorkRole[]; reason: string };

// Add a shortcode here only after Arthur approves or rejects that specific post.
export const postOverrides: Record<string, 'exclude' | WorkRole[]> = {};
export const workTags = {
  filming: ['filmedbyarthur', 'filmedbyarthurkhitrik', 'filmedbyme'],
  editing: ['editedbyarthur', 'editedbyarthurkhitrik', 'editedbyme'],
  exclude: ['notportfolio', 'akprivate'],
};

export function postShortcode(permalink: string): string | null {
  try {
    const url = new URL(permalink);
    if (url.protocol !== 'https:' || !['instagram.com', 'www.instagram.com'].includes(url.hostname) || url.port || url.username || url.password) return null;
    return url.pathname.match(/^\/(?:p|reel)\/([A-Za-z0-9_-]{5,})\/?$/)?.[1] ?? null;
  } catch { return null; }
}

const normalize = (caption: string) => caption.normalize('NFKC').toLowerCase().replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '').replace(/[’‘]/g, "'");
const self = '(?:(?:me|myself|arthur khitrik)(?!\\w)|@arthurkhitrik(?!\\w|\\.\\w))';
const filmingCredit = new RegExp(`\\b(?:filmed|filming|videography|video|camera(?: work)?)\\s*(?:and|&|/)?\\s*(?:edited|editing)?\\s*(?:by|:)\\s*${self}`, 'i');
const editingCredit = new RegExp(`\\b(?:edited|editing|edit)\\s*(?:and|&|/)?\\s*(?:filmed|filming)?\\s*(?:by|:)\\s*${self}`, 'i');
const jointCredit = new RegExp(`\\b(?:filmed|filming)\\s*(?:and|&|/)\\s*(?:edited|editing)\\s*(?:by|:)\\s*${self}`, 'i');

export function classifyPost(post: InstagramPost): PostDecision {
  const shortcode = postShortcode(post.permalink);
  if (!shortcode || /stor(y|ies)/i.test(post.mediaProductType ?? '') || !['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'].includes(post.mediaType)) {
    return { decision: 'exclude', roles: [], reason: 'Only feed posts and Reels are allowed.' };
  }
  if (post.username.toLowerCase() !== 'arthurkhitrik') return { decision: 'exclude', roles: [], reason: 'Not from Arthur’s account.' };
  const text = normalize(post.caption);
  const tags = new Set(Array.from(text.matchAll(/#([\p{L}\p{N}_]+)/gu), m => m[1]));
  if (postOverrides[shortcode] === 'exclude' || workTags.exclude.some(tag => tags.has(tag))) return { decision: 'exclude', roles: [], reason: 'Explicitly excluded.' };
  // A denial, question or quoted credit needs human review, even if keywords match.
  if (/\b(?:not|never|didn't|did not)\b[^.!?\n]{0,50}\b(?:film|filmed|edit|edited|made|my)\b|\b(?:film|filmed|edit|edited|video)\b[^.!\n]{0,50}\?|["“][^"”\n]*(?:filmed|edited|video i made)[^"”\n]*["”]/i.test(text)) {
    return { decision: 'review', roles: [], reason: 'Ambiguous or negated credit.' };
  }
  const override = postOverrides[shortcode];
  if (Array.isArray(override) && override.length) return { decision: 'include', roles: override, reason: 'Approved post.' };
  const roles: WorkRole[] = [];
  if (workTags.filming.some(tag => tags.has(tag)) || filmingCredit.test(text) || /\bi (?:filmed|am filming|was filming)\b/.test(text) || /צילמתי\s+(?:את\s+)?(?:הסרטון|הסרט|סרטון|סרט|וידאו)(?:\s|[.!]|$)/.test(text)) roles.push('Filming');
  if (workTags.editing.some(tag => tags.has(tag)) || editingCredit.test(text) || jointCredit.test(text) || /\bi (?:edited|am editing|was editing)\b|\bmy (?:video )?edit\b/.test(text) || /(?:ערכתי\s+(?:את\s+)?(?:הסרטון|הסרט|סרטון|סרט|וידאו)|עריכה\s*(?:שלי|:\s*(?:אני|@arthurkhitrik)))/.test(text)) roles.push('Editing');
  if (/צילום\s*(?:ו|&)\s*עריכה\s*(?:שלי|:\s*(?:אני|@arthurkhitrik))/.test(text)) {
    if (!roles.includes('Filming')) roles.push('Filming');
    if (!roles.includes('Editing')) roles.push('Editing');
  }
  if (/\b(?:video|film) (?:that )?i (?:made|created|produced)\b/.test(text)) roles.push('Film project');
  if (roles.length) return { decision: 'include', roles, reason: 'Caption identifies Arthur’s filming or editing work.' };
  if (/\b(?:film\w*|edit\w*|shooting|videograph\w*|cinematograph\w*|bts)\b|behind the scenes|צילום|עריכה|צילמתי|ערכתי/.test(text)) return { decision: 'review', roles: [], reason: 'Work-related words without a clear role credit.' };
  return { decision: 'exclude', roles: [], reason: 'No filming or editing credit.' };
}

export function selectWorkPosts(posts: InstagramPost[]) {
  const seen = new Set<string>();
  return posts.flatMap(post => {
    const result = classifyPost(post);
    const shortcode = postShortcode(post.permalink);
    if (result.decision !== 'include' || !shortcode || seen.has(shortcode)) return [];
    seen.add(shortcode);
    return [{ ...post, permalink: `https://www.instagram.com/p/${shortcode}/`, roles: result.roles }];
  }).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, 6);
}
