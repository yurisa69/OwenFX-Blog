import ProfileCenter from '@/components/ProfileCenter';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const metadata = { title: '我的 — OwenFX' };

export default async function ProfilePage() {
  let initialProfile: {
    id: string;
    email?: string;
    name: string;
    avatar: string | null;
    bio: string;
  } | null = null;

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const cookieStore = await cookies();
      const supabase = createServerClient(url, key, {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      });
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const authUser = session.user;
        const metadata = authUser.user_metadata || {};
        const metadataAvatar = typeof metadata.avatar_url === 'string'
          ? metadata.avatar_url
          : typeof metadata.picture === 'string'
            ? metadata.picture
            : null;
        const metadataName = typeof metadata.display_name === 'string'
          ? metadata.display_name
          : typeof metadata.name === 'string'
            ? metadata.name
            : authUser.email?.split('@')[0] || '用户';

        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name,avatar_url,bio')
          .eq('id', authUser.id)
          .maybeSingle();

        initialProfile = {
          id: authUser.id,
          email: authUser.email,
          name: profile?.display_name || metadataName,
          avatar: profile?.avatar_url || metadataAvatar,
          bio: profile?.bio || '',
        };
      }
    }
  } catch {
    // Client-side session fallback remains available if SSR profile loading fails.
  }

  return <ProfileCenter initialProfile={initialProfile} />;
}
