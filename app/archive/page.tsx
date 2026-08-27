import { posts } from '@/lib/data'
import { PostCard } from '@/components/post-card'
import { SectionTitle } from '@/components/section-title'
export default function ArchivePage(){return <div><SectionTitle eyebrow="Timeline" title="归档"/><div className="mb-5 rounded-3xl border border-white/[.06] bg-white/[.02] p-4 text-sm text-slate-400">2023 年 · 12 月 · 5 篇文章</div><div className="space-y-3">{posts.map(p=><PostCard key={p.slug} post={p}/>)}</div></div>}
