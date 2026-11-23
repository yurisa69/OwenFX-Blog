function splitSelectorList(input) {
  const selectors = [];
  let start = 0;
  let parentheses = 0;
  let brackets = 0;
  let quote = null;
  let escaped = false;
  let comment = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (comment) {
      if (char === '*' && next === '/') {
        comment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '/' && next === '*') {
      comment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '\\') {
      index += 1;
      continue;
    }
    if (char === '(') parentheses += 1;
    else if (char === ')') parentheses = Math.max(0, parentheses - 1);
    else if (char === '[') brackets += 1;
    else if (char === ']') brackets = Math.max(0, brackets - 1);
    else if (char === ',' && parentheses === 0 && brackets === 0) {
      selectors.push(input.slice(start, index));
      start = index + 1;
    }
  }

  selectors.push(input.slice(start));
  return selectors;
}

function scopeSelectorList(input, scopeName) {
  const scope = '.' + scopeName;
  return splitSelectorList(input).map((selector) => {
    const value = selector.trim();
    if (!value) return value;
    if (value === scope || value.startsWith(scope + ' ') || value.startsWith(scope + ':') || value.startsWith(scope + '[')) {
      return value;
    }

    const rootSelector = /^(html|body|:root|:host)(?=$|[\s.#:[>+~])/i;
    if (rootSelector.test(value)) return value.replace(rootSelector, scope);
    return scope + ' ' + value;
  }).join(', ');
}

module.exports = function createOwenFxCssScopePlugin() {
  return {
    postcssPlugin: 'owenfx-css-scope',
    OnceExit(root) {
      const file = (root.source && root.source.input && root.source.input.file || '').replace(/\\/g, '/');
      const scopeName = file.includes('/(site)/') ? 'site-css-scope'
        : file.includes('/(admin)/') ? 'admin-css-scope'
        : null;
      if (!scopeName) return;

      const keyframes = new Map();
      root.walkAtRules(/^(-webkit-)?keyframes$/i, (rule) => {
        const original = rule.params.trim();
        const scoped = scopeName + '-' + original;
        keyframes.set(original, scoped);
        rule.params = scoped;
      });

      if (keyframes.size) {
        root.walkDecls((decl) => {
          for (const [original, scoped] of keyframes) {
            decl.value = decl.value
              .split(/(\s+|,)/)
              .map((token) => token === original ? scoped : token)
              .join('');
          }
        });
      }

      root.walkRules((rule) => {
        let parent = rule.parent;
        while (parent) {
          if (parent.type === 'atrule' && /^(-webkit-)?keyframes$/i.test(parent.name)) return;
          parent = parent.parent;
        }
        rule.selector = scopeSelectorList(rule.selector, scopeName);
      });
    },
  };
};
