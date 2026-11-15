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

const structuralHeadingPattern = /^(?:前言|引言|概述|目录|总结|结语|参考资料|参考文献|延伸阅读|附录|致谢|相关链接)(?:\s|[:：—-]|$)/i;

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

  const addIssue = (line: number, level: number, heading: string, message: string) => {
    issues.push({ line, level, heading, message });
  };

  lines.forEach((line, index) => {
    const fence = line.match(/^\s{0,3}([\x60]{3,}|~{3,})/);
    if (!inFence && fence) {
      inFence = true;
      fenceCharacter = fence[1][0];
      fenceLength = fence[1].length;
      return;
    }
    if (inFence) {
      const closing = line.match(/^\s{0,3}([\x60]{3,}|~{3,})\s*$/);
      if (closing && closing[1][0] === fenceCharacter && closing[1].length >= fenceLength) {
        inFence = false;
        fenceCharacter = '';
        fenceLength = 0;
      }
      return;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!headingMatch) return;

    const level = headingMatch[1].length;
    const heading = headingMatch[2].trim();
    const lineNumber = index + 1;

    if (level === 2) {
      expectedSub = 1;
      if (isStructuralHeading(heading)) {
        sectionType = 'structural';
        return;
      }

      sectionType = 'steps';
      const numbered = heading.match(/^([零〇一二三四五六七八九十百千万]+)\.\s+(.+)$/);
      if (!numbered) {
        addIssue(lineNumber, level, heading, '一级大步骤应使用中文数字加英文句点，例如「一. 环境准备」。');
      } else {
        const actual = parseChineseNumber(numbered[1]);
        if (actual !== expectedMajor) {
          addIssue(lineNumber, level, heading, '一级大步骤应按顺序编号为「' + expectedMajor + '」，当前为「' + numbered[1] + '」。');
        }
      }
      expectedMajor += 1;
      return;
    }

    if (level === 3) {
      if (sectionType === 'structural') return;
      if (sectionType === 'none') {
        addIssue(lineNumber, level, heading, '二级小步骤必须归属于一个一级大步骤。');
        return;
      }

      const numbered = heading.match(/^(\d+)\.\s+(.+)$/);
      if (!numbered) {
        addIssue(lineNumber, level, heading, '二级小步骤应使用阿拉伯数字加英文句点，例如「1. 检查环境」。');
      } else {
        const actual = Number(numbered[1]);
        if (actual !== expectedSub) {
          addIssue(lineNumber, level, heading, '当前一级大步骤下的小步骤应从「' + expectedSub + '」开始并连续递增，当前为「' + numbered[1] + '」。');
        }
      }
      expectedSub += 1;
      return;
    }

    if (level >= 4 && /^(?:\d+(?:\.\d+)+\s+|\d+[.、．]\s+|[零〇一二三四五六七八九十百千万]+[.、．]\s+)/.test(heading)) {
      addIssue(lineNumber, level, heading, '三级及以下内容不要继续叠加数字编号层级，优先使用无序列表。');
    }
  });

  return issues;
}
