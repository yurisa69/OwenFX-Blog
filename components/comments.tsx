'use client'
import { MessageCircle, Image as ImageIcon, Smile, CornerDownLeft } from 'lucide-react'
import { useState } from 'react'
import type { Post } from '@/lib/data'
import { getSupabaseBrowser } from '@/lib/supabase'

const demo = [
  {name:'Phoenix Baker',date:'2023/12/10',avatar:'/avatar.svg',content:'感谢你的阅读！如果有任何想法或建议，欢迎交流~',likes:12,reply:'写得太棒了，受益匪浅！ 👍'},
  {name:'Lana Steiner',date:'2023/12/09',avatar:'/avatar.svg',content:'非常喜欢这种设计语言，简洁又强大。',likes:8,reply:'我也是，特别是颜色和间距的处理，很舒服！'},
  {name:'Ethan Zhang',date:'2023/12/09',avatar:'/avatar.svg',content:'请问文中提到的工具有推荐的替代方案吗？',likes:5},
  {name:'Kevin Zhou',date:'2023/12/08',avatar:'/avatar.svg',content:'文章结构很清晰，收藏了！',likes:3},
]

export function Comments({post}:{post:Post}){
  const [text,setText]=useState(''); const [sent,setSent]=useState(false)
  async function submit(){ if(!text.trim())return; const supabase=getSupabaseBrowser(); if(supabase){ const {data:{user}}=await supabase.auth.getUser(); if(user){ const {data:dbPost}=await supabase.from('posts').select('id').eq('slug',post.slug).maybeSingle(); if(dbPost) await supabase.from('comments').insert({post_id:dbPost.id,user_id:user.id,content:text.trim()}) }} setSent(true); setText('') }
  return <section id="comments" className="mt-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-semibold">评论 <span className="text-sm font-normal text-slate-500">({post.comments})</span></h2><span className="text-sm text-slate-500">最热⌄</span></div><div className="glass rounded-2xl p-3"><div className="flex gap-3"><img src="/avatar.svg" className="h-10 w-10 rounded-full" alt=""/><div className="min-w-0 flex-1"><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="写下你的评论…" className="min-h-20 w-full resize-none bg-transparent px-1 py-2 text-sm leading-6 outline-none placeholder:text-slate-600"/><div className="flex items-center gap-1 text-violet-300"><button className="rounded-lg p-2 hover:bg-white/[.04]"><Smile size={18}/></button><button className="rounded-lg p-2 hover:bg-white/[.04]"><ImageIcon size={18}/></button><button className="rounded-lg p-2 hover:bg-white/[.04]"><CornerDownLeft size={18}/></button><span className="ml-auto text-xs text-slate-600">{text.length}/1000</span><button onClick={submit} className="rounded-lg bg-[#6a58ee] px-4 py-2 text-sm">发送</button></div>{sent&&<div className="mt-2 text-xs text-violet-300">评论已提交；配置 Supabase 后会写入评论表。</div>}</div></div></div><div className="mt-5 space-y-4">{demo.map((c,i)=><div key={i} className="border-b border-white/[.06] pb-4 last:border-0"><div className="flex gap-3"><img src={c.avatar} className="h-9 w-9 rounded-full" alt=""/><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><b className="text-sm">{c.name}</b><span className="text-xs text-slate-600">{c.date}</span></div><p className="mt-1 text-sm leading-7 text-slate-300">{c.content}</p><div className="mt-2 flex items-center gap-5 text-xs text-slate-500"><span>♡ {c.likes}</span><span>💬 回复</span></div>{c.reply&&<div className="ml-4 mt-3 rounded-xl border-l border-white/[.07] pl-3"><div className="text-xs text-slate-600">OwenFX · {c.date}</div><p className="mt-1 text-sm text-slate-400">{c.reply}</p></div>}</div><button className="text-slate-600">•••</button></div></div>)}</div></section>
}
