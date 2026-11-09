'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase';

type AccountUser = { id: string; name: string; email?: string; avatarUrl: string | null };

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError('账号服务暂不可用，请稍后重试。');
      setLoading(false);
      return;
    }

    let active = true;
    const loadUser = async () => {
      const { data, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError || !data.user) {
        router.replace('/login?next=%2Fsettings');
        return;
      }
      const metadata = data.user.user_metadata as Record<string, unknown>;
      const metadataName = typeof metadata.display_name === 'string'
        ? metadata.display_name
        : typeof metadata.name === 'string' ? metadata.name : '';
      const metadataAvatar = typeof metadata.avatar_url === 'string'
        ? metadata.avatar_url
        : typeof metadata.picture === 'string' ? metadata.picture : null;
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name,avatar_url')
        .eq('id', data.user.id)
        .maybeSingle();
      if (!active) return;
      const account = {
        id: data.user.id,
        name: profile?.display_name || metadataName || data.user.email?.split('@')[0] || '用户',
        email: data.user.email || '',
        avatarUrl: profile?.avatar_url || metadataAvatar,
      };
      setUser(account);
      setLoading(false);
      if (new URLSearchParams(window.location.search).get('emailChange') === 'success') {
        setNotice('邮箱验证已完成，账号邮箱已更新。');
      }
      const redirectError = new URLSearchParams(window.location.hash.slice(1)).get('error_description');
      if (redirectError) {
        setError('邮箱验证未完成：' + redirectError);
      }
    };

    void loadUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'SIGNED_OUT') {
        router.replace('/');
        return;
      }
      if (event === 'USER_UPDATED' && session?.user) {
        const metadata = session.user.user_metadata as Record<string, unknown>;
        const metadataName = typeof metadata.display_name === 'string'
          ? metadata.display_name
          : typeof metadata.name === 'string' ? metadata.name : '';
        const metadataAvatar = typeof metadata.avatar_url === 'string'
          ? metadata.avatar_url
          : typeof metadata.picture === 'string' ? metadata.picture : null;
        setUser(current => ({
          id: session.user.id,
          name: current?.name || metadataName || session.user.email?.split('@')[0] || '用户',
          email: session.user.email || '',
          avatarUrl: current?.avatarUrl || metadataAvatar,
        }));
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleEmailChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice('');
    setError('');
    const nextEmail = email.trim().toLowerCase();
    if (!nextEmail) {
      setError('请输入新的邮箱地址。');
      return;
    }
    if (nextEmail === (user?.email || '').toLowerCase()) {
      setError('新邮箱与当前邮箱相同。');
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError('账号服务暂不可用，请稍后重试。');
      return;
    }

    setEmailBusy(true);
    const { error: updateError } = await supabase.auth.updateUser(
      { email: nextEmail },
      { emailRedirectTo: window.location.origin + '/settings?emailChange=success' }
    );
    setEmailBusy(false);
    if (updateError) {
      setError(updateError.message || '邮箱修改请求失败，请稍后重试。');
      return;
    }
    setNotice('验证邮件已发送。请按邮件提示完成验证，验证成功后邮箱才会更新。');
  };

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice('');
    setError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('请完整填写当前密码和两次新密码。');
      return;
    }
    if (newPassword.length < 6) {
      setError('新密码至少需要 6 位。');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致。');
      return;
    }
    if (newPassword === currentPassword) {
      setError('新密码不能与当前密码相同。');
      return;
    }
    if (!user?.email) {
      setError('当前账号没有可用于验证的邮箱，请重新登录后再试。');
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError('账号服务暂不可用，请稍后重试。');
      return;
    }

    setPasswordBusy(true);
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyError) {
      setPasswordBusy(false);
      setError('当前密码不正确，请检查后重试。');
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordBusy(false);
    if (updateError) {
      setError(updateError.message || '密码修改失败，请稍后重试。');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setNotice('密码已成功更新。');
  };

  const handleLogout = async () => {
    if (!window.confirm('确定退出当前 OwenFX 账号吗？')) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError('账号服务暂不可用，请稍后重试。');
      return;
    }
    setLogoutBusy(true);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setLogoutBusy(false);
      setError(signOutError.message || '退出登录失败，请稍后重试。');
      return;
    }
    router.replace('/');
    router.refresh();
  };

  if (loading) {
    return <div className="account-settings-page"><div className="account-settings-loading">正在加载账号设置…</div></div>;
  }

  return (
    <div className="account-settings-page">
      <div className="account-settings-topline">
        <span>OWENFX ACCOUNT</span>
        <Link href="/" className="account-settings-back">返回首页 &gt;</Link>
      </div>

      <section className="profile-identity-card account-settings-identity" aria-label="当前账号">
        <div className="profile-identity-main">
          <div className="profile-avatar-ring profile-avatar-ring-compact">
            <div className="profile-avatar-inner">
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="头像" className="h-full w-full object-cover" />
                : <span>{(user?.name || 'U').slice(0, 1).toUpperCase()}</span>}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold">{user?.name || '用户'}</h2>
            <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">{user?.email || 'OwenFX 用户'}</p>
            <span className="profile-member-state"><i className="profile-status-dot" />账号已登录</span>
          </div>
        </div>
      </section>

      {(notice || error) && (
        <div role="status" className={error ? 'account-settings-message is-error' : 'account-settings-message'}>
          {error || notice}
        </div>
      )}

      <section className="account-settings-card">
        <div className="account-settings-card-heading">
          <div><span className="account-settings-index">01</span><h2>更改邮箱</h2></div>
          <p>提交新邮箱后，需要通过验证邮件确认变更。</p>
        </div>
        <form onSubmit={handleEmailChange} className="account-settings-form">
          <label htmlFor="account-email">新邮箱地址</label>
          <input id="account-email" className="admin-input" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="输入新的邮箱地址" />
          <button type="submit" className="profile-primary-action account-settings-submit" disabled={emailBusy || !user?.email}>
            {emailBusy ? '发送验证邮件中…' : '发送邮箱验证'}
          </button>
        </form>
      </section>

      <section className="account-settings-card">
        <div className="account-settings-card-heading">
          <div><span className="account-settings-index">02</span><h2>更改密码</h2></div>
          <p>为保护账号安全，修改前需要验证当前密码。</p>
        </div>
        <form onSubmit={handlePasswordChange} className="account-settings-form">
          <label htmlFor="current-password">当前密码</label>
          <input id="current-password" className="admin-input" type="password" autoComplete="current-password" required value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} placeholder="输入当前密码" />
          <label htmlFor="new-password">新密码</label>
          <input id="new-password" className="admin-input" type="password" autoComplete="new-password" minLength={6} required value={newPassword} onChange={event => setNewPassword(event.target.value)} placeholder="至少 6 位" />
          <label htmlFor="confirm-password">确认新密码</label>
          <input id="confirm-password" className="admin-input" type="password" autoComplete="new-password" minLength={6} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="再次输入新密码" />
          <button type="submit" className="profile-primary-action account-settings-submit" disabled={passwordBusy}>
            {passwordBusy ? '正在更新密码…' : '更新密码'}
          </button>
        </form>
      </section>

      <section className="account-settings-logout">
        <div><h2>退出登录</h2><p>退出当前设备上的 OwenFX 账号。</p></div>
        <button type="button" className="profile-logout-action" onClick={handleLogout} disabled={logoutBusy}>
          {logoutBusy ? '正在退出…' : '退出当前账号'}
        </button>
      </section>
    </div>
  );
}
