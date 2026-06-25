import React, { useState, useEffect } from 'react';
import { BookOpen, Zap, Star, ExternalLink, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { getResearchPapers, getIndustryPapers, getDemoPapers, getResearchIntro, getIndustryIntro, getResearchGrouped, getIndustryGrouped, Paper, PaperCategory, SubCategory } from './data-loader';

function fixDoubleLinks(md: string): string {
  return md.replace(
    /\[([^\]]+)\]\(\[([^\]]+)\]\([^)]+\)\)/g,
    '[$1]($2)'
  );
}

function replaceDynamicCounts(md: string, grouped: PaperCategory[]): string {
  const totalPapers = grouped.reduce((sum, cat) => sum + cat.paperCount, 0);
  const cnNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  // Build a map: "第一类" -> paperCount
  const catMap = new Map<string, number>();
  for (let ci = 0; ci < grouped.length && ci < cnNums.length; ci++) {
    catMap.set(`第${cnNums[ci]}类`, grouped[ci].paperCount);
  }

  return md.split('\n').map(line => {
    // Replace total count in summary line
    let l = line.replace(/收入\s*\d+\s*篇/, `收入 ${totalPapers} 篇`);
    l = l.replace(/按照以下\s*\d+\s*类/, `按照以下 ${grouped.length} 类`);

    // Check if this line references a category
    for (const [prefix, count] of catMap) {
      if (!l.includes(prefix)) continue;
      // Replace last "：N 篇" on the line
      l = l.replace(/([：:]\s*)\d+(\s*篇)\s*$/, `$1${count}$2`);
      // Replace "（N 篇）" or "(N 篇)"
      l = l.replace(/([（(]\s*)\d+(\s*篇\s*[）)])/, `$1${count}$2`);
      break; // Only match the first category prefix found
    }

    return l;
  }).join('\n');
}

function IntroSection({ content, grouped }: { content: string; grouped: PaperCategory[] }) {
  const replaced = replaceDynamicCounts(fixDoubleLinks(content), grouped);
  const lines = replaced.trim().split('\n');
  const summaryLine = lines[0];
  const categorySummaryLines: string[] = [];
  const categoryDetails: { heading: string; body: string }[] = [];

  let i = 1;
  while (i < lines.length && !lines[i].startsWith('###')) {
    const line = lines[i].trim();
    if (line) categorySummaryLines.push(line);
    i++;
  }

  while (i < lines.length) {
    if (lines[i].startsWith('###')) {
      const heading = lines[i].replace(/^###\s*/, '').trim();
      const bodyLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('###')) {
        bodyLines.push(lines[i]);
        i++;
      }
      categoryDetails.push({ heading, body: bodyLines.join('\n').trim() });
    } else {
      i++;
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-base text-slate-600 font-serif leading-relaxed text-justify">
        <Markdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            strong: ({ children }) => <strong className="font-bold text-slate-900 font-sans">{children}</strong>,
            a: ({ href, children }) => <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
          }}
        >
          {summaryLine}
        </Markdown>
      </div>

      {categorySummaryLines.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categorySummaryLines.map((line, idx) => (
            <span key={idx} className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-100 text-sm font-bold rounded-lg font-sans">
              <Markdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                  strong: ({ children }) => <strong className="text-blue-900">{children}</strong>,
                  p: ({ children }) => <>{children}</>,
                }}
              >
                {line}
              </Markdown>
            </span>
          ))}
        </div>
      )}

      {categoryDetails.map((cat, idx) => (
        <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
            <h4 className="font-sans font-bold text-slate-900 text-sm tracking-wide">
              <Markdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                  strong: ({ children }) => <strong className="text-blue-700">{children}</strong>,
                  p: ({ children }) => <>{children}</>,
                }}
              >
                {cat.heading}
              </Markdown>
            </h4>
          </div>
          <div className="px-5 py-4 text-sm text-slate-700 font-serif leading-relaxed text-justify">
            <Markdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={{
                strong: ({ children }) => <strong className="font-bold text-slate-900 font-sans">{children}</strong>,
                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                ol: ({ children }) => <ol className="list-decimal list-outside mb-3 space-y-2 pl-5 last:mb-0">{children}</ol>,
                ul: ({ children }) => <ul className="list-disc list-outside mb-3 space-y-2 pl-5 last:mb-0">{children}</ul>,
                li: ({ children }) => <li className="text-slate-700 leading-relaxed">{children}</li>,
                a: ({ href, children }) => <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
              }}
            >
              {cat.body}
            </Markdown>
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryDivider({ name, count }: { name: string; count: number }) {
  return (
    <div className="flex items-center gap-4 py-6">
      <div className="flex-1 h-px bg-slate-200"></div>
      <div className="bg-slate-800 text-white px-4 py-2 rounded-sm font-sans text-sm font-bold tracking-wide shadow-sm">
        {name}（{count} 篇）
      </div>
      <div className="flex-1 h-px bg-slate-200"></div>
    </div>
  );
}

function SubCategoryDivider({ name, count }: { name: string; count: number }) {
  return (
    <div className="flex items-center gap-3 py-3 ml-4">
      <div className="flex-1 h-px bg-slate-200"></div>
      <div className="bg-blue-600 text-white px-3 py-1 rounded-sm font-sans text-xs font-bold tracking-wide">
        {name}（{count} 篇）
      </div>
      <div className="flex-1 h-px bg-slate-200"></div>
    </div>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const researchPapers = getResearchPapers();
  const industryPapers = getIndustryPapers();
  const demoPapers = getDemoPapers();
  const researchIntro = getResearchIntro();
  const industryIntro = getIndustryIntro();

  const researchGrouped = getResearchGrouped();
  const industryGrouped = getIndustryGrouped();

  interface NavItem {
    id: string;
    label: string;
    icon?: React.ElementType;
    isSub?: boolean;
  }

  const navItems: NavItem[] = [
    { id: 'hero', label: '导语', icon: BookOpen },
    { id: 'research', label: '研究论文', icon: Zap },
    ...researchGrouped.map(cat => ({ id: cat.id, label: cat.name, isSub: true })),
    { id: 'industry', label: '产业论文', icon: Zap },
    ...industryGrouped.map(cat => ({ id: cat.id, label: cat.name, isSub: true })),
    { id: 'demo', label: 'Demo', icon: Zap },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          const topId = visibleEntries[0].target.id;
          setActiveSection(topId);
        }
      },
      {
        rootMargin: '-10% 0px -40% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );

    // Observe all nav target elements: sections and category divs
    const allIds = navItems.map(item => item.id);
    allIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [navItems]);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const renderPaperList = (papers: Paper[]) => (
    <div className="space-y-8">
      {papers.map((paper) => (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          key={paper.key}
          className="group relative pl-6 sm:pl-10 border-l-2 border-slate-200 hover:border-blue-500 transition-colors duration-300"
        >
          <div className="absolute -left-[17px] top-0 w-8 h-8 bg-white border-2 border-slate-200 group-hover:border-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors duration-300 font-sans">
            {paper.seq.toString().padStart(2, '0')}
          </div>

          <div className="space-y-5">
            <div>
              <h4 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-3 font-serif">
                {paper.title}
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase font-sans">推荐度</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < paper.recommendation ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1 text-xs font-medium text-slate-500 font-sans">
              <div className="flex items-start gap-2">
                <span className="w-8 flex-shrink-0 font-bold tracking-widest uppercase">作者</span>
                <span className="text-slate-700">{paper.authors}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-8 flex-shrink-0 font-bold tracking-widest uppercase">单位</span>
                <span className="text-slate-700">{paper.affiliation}</span>
              </div>
            </div>

            {paper.abstract && (
              <div className="bg-blue-50/30 p-6 rounded-sm text-base text-slate-800 leading-loose border-l-4 border-blue-200 font-serif shadow-sm">
                <span className="font-bold text-slate-900 block mb-2 font-sans text-sm uppercase tracking-wider">论文简介</span>
                <div className="markdown-body">
                  <Markdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                      strong: ({ children }) => <strong className="font-bold text-slate-900 font-sans">{children}</strong>,
                    }}
                  >
                    {paper.abstract}
                  </Markdown>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex flex-wrap gap-2">
                {paper.tags.map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold rounded-full font-sans">
                    {tag}
                  </span>
                ))}
              </div>
              {paper.link && (
                <a
                  href={paper.link}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider font-sans"
                >
                  阅读原文
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderCategorizedPapers = (categories: PaperCategory[]) => (
    <div className="space-y-6">
      {categories.map((cat) => (
        <div key={cat.name} id={cat.id} className="scroll-mt-24">
          <CategoryDivider name={cat.name} count={cat.paperCount} />
          {cat.subcategories.map((sub) => (
            <div key={sub.name}>
              {cat.subcategories.length > 1 && <SubCategoryDivider name={sub.name} count={sub.paperCount} />}
              {renderPaperList(sub.papers)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-slate-900 selection:bg-blue-200">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0B1120] border-b border-slate-800 z-50 flex items-center justify-between px-4">
        <span className="font-serif font-bold text-lg text-white tracking-widest">ICDE 2026 专刊</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-300">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <AnimatePresence>
        {(isMobileMenuOpen || window.innerWidth >= 1024) && (
          <motion.nav
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className={`fixed top-16 lg:top-0 left-0 bottom-0 bg-white border-r border-slate-200 z-40 shadow-xl lg:shadow-none flex flex-col w-72 lg:w-72 ${isMobileMenuOpen ? 'w-72' : ''}`}
          >
            <div className="p-8 hidden lg:block border-b border-slate-100 flex-shrink-0">
              <h1 className="text-2xl font-serif font-black tracking-widest text-slate-900 leading-tight">
                ICDE 2026<br/>
                <span className="text-blue-700 text-lg tracking-normal font-sans font-bold">《达梦创新》子刊</span>
              </h1>
            </div>

            <div className="px-4 py-6 overflow-y-auto overflow-x-hidden custom-scrollbar flex-1">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const isActive = activeSection === item.id;
                  // Also highlight parent section when a sub-category is active
                  const isParentActive = !isActive && item.id === 'research' && activeSection.startsWith('research-cat-')
                    || item.id === 'industry' && activeSection.startsWith('industry-cat-');
                  const highlighted = isActive || isParentActive;
                  return (
                    <li key={item.id} className={item.isSub ? 'ml-4' : ''}>
                      <button
                        onClick={() => scrollTo(item.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-all duration-200 flex items-center gap-3
                          ${highlighted ? 'bg-slate-900 text-white font-bold tracking-wide' : 'text-slate-700 hover:bg-slate-100 font-bold tracking-wide'}
                          ${item.isSub ? 'text-xs py-1.5' : ''}
                        `}
                      >
                        {item.icon && <item.icon size={16} className={highlighted ? 'text-blue-400' : 'text-slate-400'} />}
                        <span className="truncate">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-16 lg:pt-0 lg:ml-72">

        <div className="bg-[#0B1120] pt-20 pb-48 px-4 sm:px-8 lg:px-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[100%] rounded-full bg-blue-500 blur-[120px]"></div>
            <div className="absolute top-[40%] -left-[10%] w-[40%] h-[60%] rounded-full bg-indigo-500 blur-[100px]"></div>
          </div>
          <div className="max-w-5xl mx-auto relative z-10 text-center space-y-6">
            <div className="inline-block border-b border-slate-600 pb-2 mb-4">
              <p className="text-slate-400 tracking-[0.2em] text-sm uppercase font-medium font-sans">
                ZHUAN KAN | 2026 年 6 月 26 日
              </p>
            </div>
            <h1 className="text-5xl sm:text-7xl font-serif font-black text-white tracking-wider">
              达梦创新
            </h1>
            <div className="w-24 h-1 bg-blue-500 mx-auto mt-6 mb-8"></div>
            <p className="text-3xl text-slate-300 font-light tracking-wide font-sans">
              ICDE 2026 专刊
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 pb-24 -mt-32 relative z-20 space-y-16">

          <section id="hero" className="scroll-mt-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 sm:p-12 lg:p-16 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100"
            >
              <div className="flex justify-between items-end border-b border-slate-200 pb-6 mb-10">
                <h2 className="text-4xl font-serif font-bold text-slate-900 tracking-wide">导语</h2>
              </div>

              <div className="text-slate-700 leading-loose font-serif">

                {/* 概要 */}
                <div className="mb-12 text-base md:text-lg text-justify">
                  <p className="mb-8">
                    <span className="float-left text-6xl md:text-7xl font-serif font-bold text-slate-900 mr-4 mt-1 leading-none drop-shadow-sm">本</span>
                    期专刊带来的是 ICDE 2026 的论文速递，涵盖了大语言模型（LLM）与数据库融合、数据库内核优化、新硬件协同加速、数据库测试基准、分布式云原生架构、数据安全与隐私保护、多模数据库等前沿方向。本专刊共收录 {researchPapers.length + industryPapers.length + demoPapers.length} 篇论文速递，均来自顶尖高校、主流科技厂商和前沿研究机构。
                  </p>
                </div>

                {/* 会议概要 */}
                <div className="mb-12 p-6 bg-slate-50/60 border border-slate-100 rounded-sm">
                  <h3 className="font-sans font-bold text-slate-900 uppercase tracking-wider text-sm mb-4">会议概要</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-serif text-justify">
                    ICDE（International Conference on Data Engineering）是 IEEE 主办的数据库领域顶级国际学术会议，与 SIGMOD、VLDB 并称数据库"三大顶会"，聚焦数据工程、数据管理与数据系统领域的前沿研究与应用创新。第 42 届会议（ICDE 2026）于 2026 年 5 月在丹麦哥本哈根举办。{' '}
                    <a href="https://icde2026.github.io/" className="text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer">官方网站</a>
                  </p>
                </div>

                {/* 分类速览 */}
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-sm">
                  <h3 className="font-sans font-bold text-slate-900 uppercase tracking-wider text-sm mb-4">分类速览</h3>
                  <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span><strong className="text-slate-900 font-sans">研究论文</strong>：{researchPapers.length} 篇论文速递</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span><strong className="text-slate-900 font-sans">产业论文</strong>：{industryPapers.length} 篇论文速递</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span><strong className="text-slate-900 font-sans">Demo</strong>：{demoPapers.length} 篇论文速递</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-16 pt-8 border-t border-slate-100 flex justify-end">
                <div className="text-right">
                  <p className="font-bold text-slate-900 text-lg tracking-wide font-sans">武汉研究院</p>
                  <p className="text-sm text-slate-500 mt-1 font-serif tracking-widest">2026 年 6 月 26 日</p>
                </div>
              </div>
            </motion.div>
          </section>

          <section id="research" className="scroll-mt-24">
            <div className="bg-white p-8 sm:p-12 lg:p-16 rounded-sm shadow-xl border border-slate-100 relative">
              <div className="mb-16 text-center">
                <h2 className="text-4xl font-serif font-bold tracking-widest text-slate-900 mb-4">研究论文</h2>
                <div className="w-12 h-1 bg-blue-600 mx-auto mb-6"></div>
                <p className="text-slate-500 tracking-wide font-sans">{researchPapers.length} 篇研究论文速递</p>
              </div>

              <div className="mb-12">
                <IntroSection content={researchIntro} grouped={researchGrouped} />
              </div>

              {renderCategorizedPapers(researchGrouped)}
            </div>
          </section>

          <section id="industry" className="scroll-mt-24">
            <div className="bg-white p-8 sm:p-12 lg:p-16 rounded-sm shadow-xl border border-slate-100 relative">
              <div className="mb-16 text-center">
                <h2 className="text-4xl font-serif font-bold tracking-widest text-slate-900 mb-4">产业论文</h2>
                <div className="w-12 h-1 bg-blue-600 mx-auto mb-6"></div>
                <p className="text-slate-500 tracking-wide font-sans">{industryPapers.length} 篇产业论文速递</p>
              </div>

              <div className="mb-12">
                <IntroSection content={industryIntro} grouped={industryGrouped} />
              </div>

              {renderCategorizedPapers(industryGrouped)}
            </div>
          </section>

          <section id="demo" className="scroll-mt-24">
            <div className="bg-white p-8 sm:p-12 lg:p-16 rounded-sm shadow-xl border border-slate-100 relative">
              <div className="mb-16 text-center">
                <h2 className="text-4xl font-serif font-bold tracking-widest text-slate-900 mb-4">Demo</h2>
                <div className="w-12 h-1 bg-blue-600 mx-auto mb-6"></div>
                <p className="text-slate-500 tracking-wide font-sans">{demoPapers.length} 篇 Demo 论文速递</p>
              </div>

              {renderPaperList(demoPapers)}
            </div>
          </section>

        </div>

        <footer className="bg-white border-t border-slate-200 py-8 text-center text-slate-500 text-sm font-sans">
          <p>《达梦创新》子刊</p>
        </footer>
      </main>
    </div>
  );
}