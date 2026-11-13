export type AkismetCommentPayload = {
  blog: string;
  user_ip: string;
  user_agent: string;
  referrer: string;
  permalink: string;
  comment_type: 'comment';
  comment_author: string;
  comment_author_email: string;
  comment_content: string;
  comment_date_gmt: string;
  blog_lang: 'zh_CN';
};

export type AkismetDecision = 'spam' | 'ham' | 'unavailable';
export type LocalCommentDecision = { action: 'pass' | 'review' | 'spam'; reason?: string };

let keyVerification: Promise<boolean> | null = null;

async function verifyAkismetKey(apiKey: string, blog: string) {
  if (!keyVerification) {
    keyVerification = (async () => {
      try {
        const response = await fetch('https://rest.akismet.com/1.1/verify-key', {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ api_key: apiKey, blog }),
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        });
        return response.ok && (await response.text()).trim() === 'valid';
      } catch {
        return false;
      }
    })().then(valid => {
      if (!valid) keyVerification = null;
      return valid;
    });
  }
  return keyVerification;
}

function toAkismetForm(payload: AkismetCommentPayload, apiKey: string) {
  const form = new URLSearchParams({ api_key: apiKey });
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string' && value.length > 0) form.set(key, value);
  }
  return form;
}

export async function checkAkismetComment(payload: AkismetCommentPayload): Promise<AkismetDecision> {
  const apiKey = process.env.AKISMET_API_KEY;
  if (!apiKey || !payload.user_ip) return 'unavailable';
  try {
    if (!(await verifyAkismetKey(apiKey, payload.blog))) return 'unavailable';
    const response = await fetch('https://rest.akismet.com/1.1/comment-check', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: toAkismetForm(payload, apiKey),
      cache: 'no-store',
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) return 'unavailable';
    const result = (await response.text()).trim().toLowerCase();
    return result === 'true' ? 'spam' : result === 'false' ? 'ham' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

export async function submitAkismetFeedback(payload: AkismetCommentPayload, type: 'spam' | 'ham') {
  const apiKey = process.env.AKISMET_API_KEY;
  if (!apiKey) return false;
  try {
    if (!(await verifyAkismetKey(apiKey, payload.blog))) return false;
    const response = await fetch(`https://rest.akismet.com/1.1/submit-${type}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: toAkismetForm(payload, apiKey),
      cache: 'no-store',
      signal: AbortSignal.timeout(7000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function classifyCommentLocally(body: string, honeypotValue = ''): LocalCommentDecision {
  if (honeypotValue.trim()) return { action: 'spam', reason: '触发隐藏反机器人字段' };
  const urlCount = (body.match(/https?:\/\/|www\./giu) || []).length;
  if (urlCount >= 3) return { action: 'spam', reason: '评论包含过多外部链接' };
  if (/<\s*(script|iframe|object|embed|svg|form)\b|\bon\w+\s*=/iu.test(body)) {
    return { action: 'spam', reason: '评论包含可执行或嵌入式 HTML 标记' };
  }
  const promotion = /(加(?:我)?(?:微信|v信)|微信(?:联系|咨询)|(?:vx|v信)\s*[:：]?\s*[a-z0-9_-]{4,}|telegram|电报|私聊(?:领取|获取|联系)|点击链接领取|博彩引流|赌场推广|刷单返利|裸聊|成人视频|色情直播|代开发票|稳赚不赔)/iu;
  const hasContactOrLink = /(https?:\/\/|www\.|加(?:我)?(?:微信|v信)|微信联系|telegram|电报|私聊|联系(?:客服|我))/iu.test(body);
  if (promotion.test(body) && hasContactOrLink) return { action: 'spam', reason: '命中高置信度广告或违规推广规则' };
  if (urlCount > 0 && /(优惠|推广|代理|返利|兼职|赚钱|领取|联系我|加群)/iu.test(body)) {
    return { action: 'review', reason: '包含外链及推广导向内容' };
  }
  return { action: 'pass' };
}
