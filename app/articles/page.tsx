import { posts } from '@/lib/data'
import { PostCard } from '@/components/post-card'
import { SectionTitle } from '@/components/section-title'
export default function ArticlesPage(){return <section className="space-y-4"><SectionTitle eyebrow="Archive" title="全部文章" action={<span className="text-sm text-slate-500">{posts.length} 篇</span>}/>{posts.map(p=><PostCard key={p.slug} post={p}/>)}</section>}
