const SUPPORTED_DOMAINS = [
  'gmail.com','qq.com','163.com','126.com','outlook.com','hotmail.com','icloud.com','yahoo.com','proton.me','protonmail.com',
]
export const REGISTRATION_EMAIL_UNSUPPORTED_MESSAGE =
  '暂不支持该邮箱域名，请使用 Gmail / QQ / 163 / Outlook 等常见邮箱注册。'
export function isSupportedRegistrationEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return SUPPORTED_DOMAINS.includes(domain)
}
