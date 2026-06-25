import researchJson from '../source-md/研究论文.json';
import industryJson from '../source-md/产业论文.json';
import demoJson from '../source-md/demo.json';
import researchIntroRaw from '../source-md/研究论文导语.md?raw';
import industryIntroRaw from '../source-md/产业论文导语.md?raw';
import researchCategoryJson from '../source-md/研究论文分类.json';
import industryCategoryJson from '../source-md/产业论文分类.json';

export interface Paper {
  key: string;
  seq: number;
  originalId: number;
  title: string;
  recommendation: number;
  authors: string;
  affiliation: string;
  abstract: string;
  link: string;
  tags: string[];
}

export interface SubCategory {
  name: string;
  paperCount: number;
  papers: Paper[];
}

export interface PaperCategory {
  id: string;
  name: string;
  paperCount: number;
  subcategories: SubCategory[];
}

interface CategoryDef {
  name: string;
  subcategories: { name: string; paperIds: number[] }[];
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

function normalizePapers(raw: any[], prefix: string): Paper[] {
  return raw
    .filter((p) => p.title && p.title.trim())
    .map((p, idx) => ({
      key: `${prefix}-${p.id ?? idx}`,
      seq: idx + 1,
      originalId: p.id ?? 0,
      title: p.title ?? '',
      recommendation: p.recommendation ?? 3,
      authors: p.authors ?? '',
      affiliation: p.affiliation ?? '',
      abstract: p.abstract ?? '',
      link: p.link ?? '',
      tags: parseTags(p.tags),
    }));
}

function groupPapers(papers: Paper[], categoryDefs: CategoryDef[], prefix: string): PaperCategory[] {
  const assigned = new Set<number>();
  const result: PaperCategory[] = [];
  let seqCounter = 0;

  for (let ci = 0; ci < categoryDefs.length; ci++) {
    const cat = categoryDefs[ci];
    const subcats: SubCategory[] = [];
    let catTotal = 0;

    for (const sub of cat.subcategories) {
      const matched = papers.filter(p => sub.paperIds.includes(p.originalId) && !assigned.has(p.originalId));
      matched.forEach(p => assigned.add(p.originalId));
      // Sort: Best Paper / Best Paper Runner Up first, then by recommendation descending
      matched.sort((a, b) => {
        const aBest = a.title.includes('Best Paper') ? 1 : 0;
        const bBest = b.title.includes('Best Paper') ? 1 : 0;
        if (aBest !== bBest) return bBest - aBest;
        return b.recommendation - a.recommendation;
      });
      for (const p of matched) {
        seqCounter++;
        p.seq = seqCounter;
      }
      subcats.push({ name: sub.name, paperCount: matched.length, papers: matched });
      catTotal += matched.length;
    }

    result.push({
      id: `${prefix}-cat-${ci + 1}`,
      name: cat.name,
      paperCount: catTotal,
      subcategories: subcats,
    });
  }

  const unassigned = papers.filter(p => !assigned.has(p.originalId));
  if (unassigned.length > 0) {
    for (const p of unassigned) {
      seqCounter++;
      p.seq = seqCounter;
    }
    result.push({
      id: `${prefix}-cat-other`,
      name: '其他',
      paperCount: unassigned.length,
      subcategories: [{ name: '未分类', paperCount: unassigned.length, papers: unassigned }],
    });
  }

  return result;
}

export function getResearchPapers(): Paper[] {
  return normalizePapers(researchJson as any[], 'research');
}

export function getIndustryPapers(): Paper[] {
  return normalizePapers(industryJson as any[], 'industry');
}

export function getDemoPapers(): Paper[] {
  return normalizePapers(demoJson as any[], 'demo');
}

export function getResearchIntro(): string {
  return researchIntroRaw;
}

export function getIndustryIntro(): string {
  return industryIntroRaw;
}

export function getResearchGrouped(): PaperCategory[] {
  return groupPapers(getResearchPapers(), researchCategoryJson as CategoryDef[], 'research');
}

export function getIndustryGrouped(): PaperCategory[] {
  return groupPapers(getIndustryPapers(), industryCategoryJson as CategoryDef[], 'industry');
}
