export const REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE = '本站暂不支持此邮箱注册';
export const SUPPORTED_REGISTRATION_EMAIL_DOMAINS = [
  'gmail.com','outlook.com','hotmail.com','live.com','icloud.com','me.com','mac.com','yahoo.com',
  'proton.me','protonmail.com','aol.com','zoho.com','yandex.com','qq.com','foxmail.com','163.com',
  '126.com','yeah.net','sina.com','sina.cn','sohu.com','aliyun.com','139.com','189.cn','21cn.com','tom.com',
] as const;
const supportedDomains = new Set<string>(SUPPORTED_REGISTRATION_EMAIL_DOMAINS);
export function getRegistrationEmailDomain(email: string) {
  const normalized = email.trim().toLowerCase();
  const parts = normalized.split('@');
  return parts.length === 2 && parts[0] && parts[1] ? parts[1] : null;
}
export function isSupportedRegistrationEmail(email: string) {
  const domain = getRegistrationEmailDomain(email);
  return domain ? supportedDomains.has(domain) : false;
}
