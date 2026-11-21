const ALLOWED = new Set('a b blockquote br code del div em h1 h2 h3 h4 h5 h6 hr i img li ol p pre s span strong sub sup table tbody td tfoot th thead tr u ul'.split(' '));
const DROP = new Set('audio base button canvas embed form iframe input link math meta noscript object option portal script select source style svg template textarea track video'.split(' '));

export function isSafePastedUrl(value: string, image = false): boolean {
  const url = value.trim();
  const controls = Array.from(url).some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127);
  if (!url || url.includes(String.fromCharCode(92)) || controls) return false;
  if (url.startsWith('//') || url.startsWith('#') || url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) return true;
  const scheme = url.match(/^([a-z][a-z\d+.-]*):/i)?.[1]?.toLowerCase();
  return scheme === 'http' || scheme === 'https' || (!image && scheme === 'mailto');
}

function appendSafe(node: Node, parent: HTMLElement) {
  if (node.nodeType === Node.TEXT_NODE) {
    parent.appendChild(document.createTextNode(node.textContent || ''));
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const source = node as Element;
  const tag = source.tagName.toLowerCase();
  if (DROP.has(tag)) return;
  if (!ALLOWED.has(tag)) {
    for (const child of Array.from(source.childNodes)) appendSafe(child, parent);
    return;
  }

  const clean = document.createElement(tag);
  for (const attribute of Array.from(source.attributes)) {
    const name = attribute.name.toLowerCase();
    const value = attribute.value.trim();
    if (name.startsWith('on') || ['style', 'id', 'srcset'].includes(name)) continue;
    if (name === 'title' || (name === 'alt' && tag === 'img')) clean.setAttribute(name, value);
    else if (name === 'href' && tag === 'a' && isSafePastedUrl(value)) clean.setAttribute(name, value);
    else if (name === 'src' && tag === 'img' && isSafePastedUrl(value, true)) clean.setAttribute(name, value);
    else if (name === 'target' && tag === 'a' && value === '_blank') {
      clean.setAttribute('target', '_blank');
      clean.setAttribute('rel', 'noopener noreferrer');
    } else if (name === 'class' && (tag === 'pre' || tag === 'code')) {
      const language = value.split(/\s+/).find(item => /^language-[a-z\d_+#.-]{1,40}$/i.test(item));
      if (language) clean.setAttribute('class', language);
    } else if (name === 'data-language' && tag === 'pre' && /^[a-z\d_+#.-]{1,40}$/i.test(value)) {
      clean.setAttribute(name, value);
    } else if (((tag === 'img' && (name === 'width' || name === 'height')) || ((tag === 'td' || tag === 'th') && (name === 'colspan' || name === 'rowspan')) || (tag === 'ol' && name === 'start')) && /^\d{1,5}$/.test(value)) {
      clean.setAttribute(name, value);
    }
  }

  if (tag === 'img') {
    clean.setAttribute('loading', 'lazy');
    clean.setAttribute('decoding', 'async');
    clean.setAttribute('referrerpolicy', 'no-referrer');
  }
  for (const child of Array.from(source.childNodes)) appendSafe(child, clean);
  parent.appendChild(clean);
}

export function sanitizePastedHtml(html: string): string {
  if (!html.trim()) return '';
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const clean = document.createElement('div');
  for (const child of Array.from(parsed.body.childNodes)) appendSafe(child, clean);
  return clean.innerHTML;
}
