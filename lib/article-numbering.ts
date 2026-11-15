export type ArticleNumberingIssue = {
  line: number;
  level: number;
  heading: string;
  message: string;
};

const chineseDigits: Record<string, number> = {
  零: 0, 〇: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5,
  六: 6, 七: 7, 八: 8, 九: 9,
};

const chineseUnits: Record<string, number> = {
  十: 10, 百: 100, 千: 1000, 万: 10000,
};

const structuralHeadingPattern = /^(?:前言|引言|概述|目录|总结|结语|官方资料|参考资料|参考文献|延伸阅读|附录|致谢|相关链接)(?:\s|[:：—-]|$)/i;

function parseCircledNumber(value: string): number | null {
  const codePoint = value.codePointAt(0);
  if (codePoint === undefined) return null;
  if (codePoint >= 0x2460 && codePoint <= 0x2473) return codePoint - 0x245f;
  if (codePoint >= 0x3251 && codePoint <= 0x325f) return codePoint - 0x323c;
  if (codePoint >= 0x32b1 && codePoint <= 0x32bf) return codePoint - 0x328d;
  return null;
}

function circleNumberForMessage(value: number): string {
  if (value >= 1 && value <= 20) return String.fromCodePoint(0x245f + value);
  if (value >= 21 && value <= 35) return String.fromCodePoint(0x323c + value);
  if (value >= 36 && value <= 50) return String.fromCodePoint(0x328d + value);
  return String(value);
}


function parseChineseNumber(value: string): number | null {
  if (!value || !/^[零〇一二三四五六七八九十百千万]+$/.test(value)) return null;

  let total = 0;
  let section = 0;
  let digit = 0;

  for (const character of value) {
    if (Object.hasOwn(chineseDigits, character)) {
      digit = chineseDigits[character];
      continue;
    }
    const unit = chineseUnits[character];
    if (unit === 10000) {
      section = (section + digit) * unit;
      total += section;
      section = 0;
      digit = 0;
    } else if (unit) {
      section += (digit || 1) * unit;
      digit = 0;
    }
  }

  return total + section + digit;
}

function isStructuralHeading(heading: string) {
  return structuralHeadingPattern.test(heading.trim());
}

export function validateArticleNumbering(markdown: string): ArticleNumberingIssue[] {
  const issues: ArticleNumberingIssue[] = [];
  const lines = markdown.split(/\r?\n/);
  let inFence = false;
  let fenceCharacter = '';
  let fenceLength = 0;
  let sectionType: 'none' | 'steps' | 'structural' = 'none';
  let expectedMajor = 1;
  let expectedSub = 1;
  let expectedTertiary = 1;
  let hasSeenH1 = false;
  let hasSeenH2 = false;
  let currentH2IsStructural = false;

  const addIssue = (line: number, level: number, heading: string, message: string) => {
    issues.push({ line, level, heading, message });
  };

  lines.forEach((line, index) => {
    const fence = line.match(/^\s{0,3}([`]{3,}|~{3,})/);
    if (!inFence && fence) {
      inFence = true;
      fenceCharacter = fence[1][0];
      fenceLength = fence[1].length;
      return;
    }
    if (inFence) {
      const closing = line.match(/^\s{0,3}([`]{3,}|~{3,})\s*$/);
      if (closing && closing[1][0] === fenceCharacter && closing[1].length >= fenceLength) {
        inFence = false;
        fenceCharacter = '';
        fenceLength = 0;
      }
      return;
    }

    const headingMatch = line.replace(/^\s{0,3}/, '').match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!headingMatch) return;

    const level = headingMatch[1].length;
    const heading = headingMatch[2].trim();
    const lineNumber = index + 1;

    if (level === 1) {
      expectedSub = 1;
      expectedTertiary = 1;
      hasSeenH2 = false;
      currentH2IsStructural = false;

      if (isStructuralHeading(heading)) {
        sectionType = 'structural';
        hasSeenH1 = true;
        return;
      }

      const numbered = heading.match(/^([零〇一二三四五六七八九十百千万]+)、\s*(.+)$/);
      // The first unnumbered H1 is the article title. Subsequent H1 headings
      // are major steps and must use Chinese numerals followed by a dunhao.
      if (!numbered && !hasSeenH1) {
        hasSeenH1 = true;
        sectionType = 'none';
        return;
      }

      hasSeenH1 = true;
      sectionType = 'steps';
      if (!numbered) {
        addIssue(lineNumber, level, heading, '一级标题应使用 H1 和中文数字加顿号，例如「# 一、环境准备」。');
      } else {
        const actual = parseChineseNumber(numbered[1]);
        if (actual !== expectedMajor) {
          addIssue(lineNumber, level, heading, '一级标题应按顺序编号为「' + expectedMajor + '」，当前为「' + numbered[1] + '」。');
        }
      }
      expectedMajor += 1;
      return;
    }

    if (level === 2) {
      expectedTertiary = 1;
      hasSeenH2 = true;

      if (isStructuralHeading(heading)) {
        currentH2IsStructural = true;
        return;
      }
      currentH2IsStructural = false;
      if (sectionType !== 'steps') {
        addIssue(lineNumber, level, heading, '二级标题必须归属于一个一级标题（H1）。');
        return;
      }

      const numbered = heading.match(/^(\d+)\.\s+(.+)$/);
      if (!numbered) {
        addIssue(lineNumber, level, heading, '二级标题应使用阿拉伯数字加英文句点，例如「## 1. 检查环境」。');
      } else {
        const actual = Number(numbered[1]);
        if (actual !== expectedSub) {
          addIssue(lineNumber, level, heading, '当前一级标题下的二级标题应从「' + expectedSub + '」开始并连续递增，当前为「' + numbered[1] + '」。');
        }
      }
      expectedSub += 1;
      return;
    }

    if (level === 3) {
      if (isStructuralHeading(heading) || currentH2IsStructural || sectionType === 'structural') return;
      if (sectionType !== 'steps') {
        addIssue(lineNumber, level, heading, '三级标题必须归属于一个一级标题（H1）。');
        return;
      }
      if (!hasSeenH2) {
        addIssue(lineNumber, level, heading, '三级标题必须归属于一个二级标题（H2）。');
        return;
      }

      const numbered = heading.match(/^([①-⑳㉑-㉟㊱-㊿])\s+(.+)$/);
      if (!numbered) {
        addIssue(lineNumber, level, heading, '三级标题应使用 Unicode 带圈阿拉伯数字，例如「### ① 检查运行状态」。');
      } else {
        const actual = parseCircledNumber(numbered[1]) ?? 0;
        if (actual !== expectedTertiary) {
          addIssue(lineNumber, level, heading, '当前二级标题下的三级标题应从「' + circleNumberForMessage(expectedTertiary) + '」开始并连续递增，当前为「' + numbered[1] + '」。');
        }
      }
      expectedTertiary += 1;
      return;
    }

    if (level >= 4 && /^(?:\d+(?:\.\d+)+\s+|\d+[.、．]\s+|[零〇一二三四五六七八九十百千万]+[.、．]\s+)/.test(heading)) {
      addIssue(lineNumber, level, heading, '四级及以下内容不要继续叠加数字标题层级，优先使用无序列表。');
    }
  });

  return issues;
}

function chineseNumberForHeading(value: number): string | null {
  if (!Number.isInteger(value) || value < 1 || value > 9999) return null;
  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const units = ['', '十', '百', '千'];
  let result = '';
  let pendingZero = false;
  let remaining = value;

  for (let position = 3; position >= 0; position -= 1) {
    const unitValue = 10 ** position;
    const digit = Math.floor(remaining / unitValue);
    remaining %= unitValue;
    if (digit === 0) {
      if (result && remaining > 0) pendingZero = true;
      continue;
    }
    if (pendingZero) result += '零';
    if (!(position === 1 && digit === 1 && result === '')) result += digits[digit];
    result += units[position];
    pendingZero = false;
  }
  return result;
}

function stripExistingHeadingNumber(heading: string): string {
  let cleaned = heading.trimStart();
  let removedPrefix = false;

  // Consume every explicitly marked legacy prefix, regardless of whether its
  // number matches the current number. This handles mixed and nested formats.
  while (cleaned) {
    const markedPrefix = cleaned.match(/^(?:\d+(?:\.\d+)+(?:[、.．-])?\s*|\d+[、.．-]\s*|[零〇一二三四五六七八九十百千万]+[、.．-]\s*|[①-⑳㉑-㉟㊱-㊿](?:[、.．-])?\s+|[（(【[]\d+[）)】\]]\s*)/);
    if (markedPrefix) {
      cleaned = cleaned.slice(markedPrefix[0].length).trimStart();
      removedPrefix = true;
      continue;
    }

    // Old repair operations sometimes left the next number without punctuation.
    // Only consume bare numbers after a marked prefix established a numbered heading.
    if (removedPrefix) {
      const repeatedPrefix = cleaned.match(/^(?:\d{1,3}(?:\.\d+)*|[零〇一二三四五六七八九十百千万]+|[①-⑳㉑-㉟㊱-㊿]|[（(【[]\d+[）)】\]])\s+/);
      if (repeatedPrefix) {
        cleaned = cleaned.slice(repeatedPrefix[0].length).trimStart();
        continue;
      }
    }
    break;
  }

  return cleaned;
}

/**
 * Detects the previous article layout: article title in H1, major sections in
 * numbered H2, and nested sections in H3/H4. That layout is promoted one level
 * so it matches the current H1/H2/H3 policy before numbering is normalized.
 */
function usesLegacyHeadingHierarchy(markdown: string): boolean {
  const lines = markdown.split(/\r?\n/);
  let inFence = false;
  let fenceCharacter = '';
  let fenceLength = 0;
  let hasArticleTitle = false;
  let hasNumberedH2 = false;
  let hasNumberedH1Step = false;

  for (const line of lines) {
    const fence = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (!inFence && fence) {
      inFence = true;
      fenceCharacter = fence[1][0];
      fenceLength = fence[1].length;
      continue;
    }
    if (inFence) {
      const closing = line.match(/^\s{0,3}(`{3,}|~{3,})\s*$/);
      if (closing && closing[1][0] === fenceCharacter && closing[1].length >= fenceLength) {
        inFence = false;
        fenceCharacter = '';
        fenceLength = 0;
      }
      continue;
    }

    const match = line.replace(/^\s{0,3}/, '').match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const level = match[1].length;
    const heading = stripExistingHeadingNumber(match[2].trim());
    if (level === 1 && !isStructuralHeading(heading)) {
      if (!hasArticleTitle && !/^(?:[零〇一二三四五六七八九十百千万]+)[、.．-]/.test(match[2].trim())) {
        hasArticleTitle = true;
      } else if (/^[零〇一二三四五六七八九十百千万]+、/.test(match[2].trim())) {
        hasNumberedH1Step = true;
      }
    }
    if (level === 2 && /^\d+(?:\.\d+)*[.、．-]?\s*\S/.test(match[2].trim())) {
      hasNumberedH2 = true;
    }
  }

  return hasArticleTitle && hasNumberedH2 && !hasNumberedH1Step;
}

/**
 * Repairs article heading hierarchy and numbering when the legacy layout is
 * unambiguous. It preserves body text, code fences, and list structure.
 */
export function autoFixArticleNumbering(markdown: string): { markdown: string; fixedCount: number } {
  const parts = markdown.split(/(\r\n|\n)/);
  const legacyHierarchy = usesLegacyHeadingHierarchy(markdown);
  let inFence = false;
  let fenceCharacter = '';
  let fenceLength = 0;
  let sectionType: 'none' | 'steps' | 'structural' = 'none';
  let expectedMajor = 1;
  let expectedSub = 1;
  let expectedTertiary = 1;
  let hasSeenH1 = false;
  let hasSeenH2 = false;
  let currentH2IsStructural = false;
  let fixedCount = 0;

  for (let partIndex = 0; partIndex < parts.length; partIndex += 2) {
    const line = parts[partIndex];
    const fence = line.match(/^\s{0,3}(\x60{3,}|~{3,})/);
    if (!inFence && fence) {
      inFence = true;
      fenceCharacter = fence[1][0];
      fenceLength = fence[1].length;
      continue;
    }
    if (inFence) {
      const closing = line.match(/^\s{0,3}(\x60{3,}|~{3,})\s*$/);
      if (closing && closing[1][0] === fenceCharacter && closing[1].length >= fenceLength) {
        inFence = false;
        fenceCharacter = '';
        fenceLength = 0;
      }
      continue;
    }

    const headingIndent = line.match(/^\s{0,3}/)?.[0] || '';
    const rawHeading = line.slice(headingIndent.length).match(/^(#{1,6}\s+)(.*?)(\s+#+\s*)?$/);
    if (!rawHeading) continue;
        const originalLevel = rawHeading[1].trim().length;
    if (originalLevel > (legacyHierarchy ? 4 : 3)) continue;
    const level = legacyHierarchy && originalLevel >= 2 ? originalLevel - 1 : originalLevel;

    const originalHeading = rawHeading[2].trim();
    const cleanHeading = stripExistingHeadingNumber(originalHeading);
    let nextHeading = originalHeading;

    if (level === 1) {
      expectedSub = 1;
      expectedTertiary = 1;
      hasSeenH2 = false;
      currentH2IsStructural = false;

      if (isStructuralHeading(cleanHeading)) {
        sectionType = 'structural';
        hasSeenH1 = true;
        nextHeading = cleanHeading;
      } else if (!hasSeenH1 && cleanHeading === originalHeading && !/^(?:[零〇一二三四五六七八九十百千万]+|\d+)[、.．-]/.test(originalHeading)) {
        hasSeenH1 = true;
        sectionType = 'none';
      } else {
        hasSeenH1 = true;
        sectionType = 'steps';
        const number = chineseNumberForHeading(expectedMajor);
        if (number) nextHeading = number + '、' + cleanHeading;
        expectedMajor += 1;
      }
    } else if (level === 2) {
      expectedTertiary = 1;
      hasSeenH2 = true;
      if (isStructuralHeading(cleanHeading)) {
        currentH2IsStructural = true;
        nextHeading = cleanHeading;
      } else {
        currentH2IsStructural = false;
        if (sectionType === 'steps') {
          nextHeading = expectedSub + '. ' + cleanHeading;
          expectedSub += 1;
        }
      }
    } else if (level === 3) {
      if (isStructuralHeading(cleanHeading) || currentH2IsStructural) {
        nextHeading = cleanHeading;
      } else if (sectionType === 'steps' && hasSeenH2 && expectedTertiary <= 50) {
        const circled = circleNumberForMessage(expectedTertiary);
        nextHeading = circled + ' ' + cleanHeading;
        expectedTertiary += 1;
      }
    }

    const nextPrefix = '#'.repeat(level) + ' ';
    if (nextPrefix !== rawHeading[1] || nextHeading !== originalHeading) {
      parts[partIndex] = headingIndent + nextPrefix + nextHeading + (rawHeading[3] || '');
      fixedCount += 1;
    }
  }

  return { markdown: parts.join(''), fixedCount };
}

export function getArticleNumberingPublishError(status: string, markdown: string) {
  if (status !== 'published') return null;
  const issues = validateArticleNumbering(markdown);
  if (issues.length === 0) return null;
  return {
    error: '文章编号不符合规范，请修正后再发布。',
    issues,
  };
}

// The revised H1/H2/H3 hierarchy became effective with the updated guidelines
// commit. Keep this timestamp in UTC so historical article checks remain stable.
export const ARTICLE_NUMBERING_EFFECTIVE_AT = '2026-11-15T19:03:22.089Z';

/**
 * Historical revisions created before the revised hierarchy took effect may
 * be restored unchanged. Newer revisions and unknown timestamps are validated.
 */
export function getArticleNumberingRevisionRestoreError(
  status: string,
  markdown: string,
  revisionCreatedAt: string | null | undefined,
) {
  if (status !== 'published') return null;
  const createdAt = revisionCreatedAt ? Date.parse(revisionCreatedAt) : Number.NaN;
  const effectiveAt = Date.parse(ARTICLE_NUMBERING_EFFECTIVE_AT);
  if (Number.isFinite(createdAt) && createdAt < effectiveAt) return null;
  return getArticleNumberingPublishError(status, markdown);
}

