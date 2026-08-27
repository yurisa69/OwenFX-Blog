import { Bookmark } from 'lucide-react'
import { SectionTitle } from '@/components/section-title'
export default function BookmarksPage(){return <div><SectionTitle eyebrow="Library" title="我的收藏"/><div className="glass rounded-3xl p-8 text-center"><Bookmark className="mx-auto text-slate-600" size={34}/><h2 className="mt-4 font-medium">还没有收藏</h2><p className="mt-2 text-sm text-slate-500">登录后点击文章右上角的书签，可以将文章保存到这里。</p></div></div>}
