import researchJson from '../source-md/研究论文.json';
import industryJson from '../source-md/产业论文.json';
import demoJson from '../source-md/demo.json';
import researchIntroRaw from '../source-md/研究论文导语.md?raw';
import industryIntroRaw from '../source-md/产业论文导语.md?raw';

export interface Paper {
  id: number;
  title: string;
  recommendation: number;
  authors: string;
  affiliation: string;
  abstract: string;
  link: string;
  tags: string[];
}

function parseTags(raw: string[] | string | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    const joined = raw.join('、');
    return joined.split('、').map((s: string) => s.trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    return raw.split('、').map((s: string) => s.trim()).filter(Boolean);
  }
  return [];
}

function normalizePapers(raw: any[]): Paper[] {
  return raw
    .filter((p) => p.title && p.title.trim())
    .map((p, idx) => ({
      id: idx + 1,
      title: p.title ?? '',
      recommendation: p.recommendation ?? 3,
      authors: p.authors ?? '',
      affiliation: p.affiliation ?? '',
      abstract: p.abstract ?? '',
      link: p.link ?? '',
      tags: parseTags(p.tags),
    }));
}

export function getResearchPapers(): Paper[] {
  return normalizePapers(researchJson as any[]);
}

export function getIndustryPapers(): Paper[] {
  return normalizePapers(industryJson as any[]);
}

export function getDemoPapers(): Paper[] {
  return normalizePapers(demoJson as any[]);
}

export function getResearchIntro(): string {
  return researchIntroRaw;
}

export function getIndustryIntro(): string {
  return industryIntroRaw;
}
