'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Menu, Search, Home, FileText, Grid2X2, Tag, Archive, UserCircle, Bookmark, Settings, Sparkles, Github, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { author, tags, posts } from '@/lib/data'
import { IconButton } from './icon-button'
import { ThemeToggle } from './theme-toggle'

const nav = [
  ['/', '首页', Home], ['/#articles', '文章', FileText], ['/projects', '项目', Grid2X2], ['/tags', '标签', Tag], ['/archive', '归档', Archive], ['/about', '关于我', UserCircle],
] as const

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(false)
  useEffect(() => { setOpen(false) }, [pathname])
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/[.055] bg-[#070b14]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1520px] items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="打开菜单"><Menu size={23}/></button>
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-[-.03em]"><span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#6452ee] to-[#9586ff] text-[10px] shadow-[0_0_25px_rgba(117,96,255,.25)]">///</span><span className="text-lg">OwenFX</span></Link>
          </div>
          <nav className="hidden items-center gap-7 lg:flex">
            {nav.slice(0,4).map(([href, label]) => <Link key={label} href={href} className={`text-sm ${pathname === href ? 'text-white' : 'text-slate-400 hover:text-white'}`}>{label}</Link>)}
          </nav>
          <div className="flex items-center gap-1">
            <IconButton label="搜索" onClick={() => setSearch(true)}><Search size={19}/></IconButton>
            <ThemeToggle/>
            <Link href="/#subscribe" className="hidden rounded-lg bg-[#5f4de5] px-4 py-2 text-sm font-medium shadow-[0_0_30px_rgba(95,77,229,.18)] transition hover:bg-[#6e5bf0] sm:block">◔ 订阅</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1520px] grid-cols-1 gap-6 px-4 pb-10 pt-6 lg:grid-cols-[270px_minmax(0,1fr)_270px] lg:px-6">
        <aside className="hidden lg:block">
          <Sidebar/>
        </aside>
        <main className="min-w-0">{children}</main>
        <aside className="hidden lg:block"><RightRail/></aside>
      </div>

      <div className="fixed inset-x-4 bottom-4 z-30 lg:hidden"><div className="glass flex items-center justify-around rounded-2xl px-2 py-2 shadow-2xl"><MobileNav/></div></div>

      {open && <div className="fixed inset-0 z-50 bg-[#03060d]/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
        <aside className="glass h-full w-[min(86vw,390px)] rounded-none border-l-0 p-5" onClick={(e) => e.stopPropagation()}>
          <div className="mb-6 flex items-center justify-between"><div className="text-lg font-semibold">导航</div><IconButton label="关闭" onClick={() => setOpen(false)}><X size={19}/></IconButton></div>
          <Sidebar mobile/>
        </aside>
      </div>}

      {search && <SearchOverlay onClose={() => setSearch(false)}/>} 
    </div>
  )
}

function Sidebar({ mobile = false }: { mobile?: boolean }) {
  return <div className={`${mobile ? '' : 'sticky top-24'} space-y-4`}>
    <section className="glass rounded-2xl p-4">
      <div className="flex flex-col items-center text-center"><img src="/avatar.svg" alt="OwenFX" className="h-20 w-20 rounded-full border border-white/[.08]"/><h2 className="mt-3 text-xl font-semibold">{author.name}</h2><p className="mt-1 text-sm leading-6 text-slate-400">{author.bio}</p>
        <div className="mt-4 flex gap-2"><a href={process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com'} className="grid h-9 w-9 place-items-center rounded-full bg-white/[.045] hover:bg-white/[.08]"><Github size={17}/></a><a href={process.env.NEXT_PUBLIC_X_URL || 'https://x.com'} className="grid h-9 w-9 place-items-center rounded-full bg-white/[.045] hover:bg-white/[.08]">𝕏</a><a href={process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me'} className="grid h-9 w-9 place-items-center rounded-full bg-white/[.045] hover:bg-white/[.08]"><Send size={16}/></a></div>
      </div>
      <div className="mt-5 space-y-1">
        {nav.map(([href,label,Icon]) => <Link key={label} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-slate-300 hover:bg-white/[.04] hover:text-white"><Icon size={19}/><span>{label}</span></Link>)}
      </div>
    </section>
    <section className="glass rounded-2xl p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-medium">标签云</h3><span className="text-slate-500">⌄</span></div><div className="flex flex-wrap gap-2">{tags.map(([name,count]) => <Link href={`/tags?tag=${encodeURIComponent(name)}`} key={name} className="rounded-lg bg-white/[.035] px-3 py-2 text-sm text-slate-300 hover:bg-white/[.07]">{name} <span className="text-slate-500">{count}</span></Link>)}</div><Link href="/tags" className="mt-4 inline-block text-sm text-violet-300">查看全部标签 →</Link></section>
    <section className="glass rounded-2xl p-4"><div className="flex items-center gap-3 px-1 py-2 text-slate-300"><MoonIcon/><span>深色模式</span><span className="ml-auto h-6 w-12 rounded-full bg-[#6a58ee] p-1"><span className="ml-auto block h-4 w-4 rounded-full bg-white"/></span></div><Link href="/bookmarks" className="flex items-center gap-3 rounded-xl px-1 py-2.5 text-slate-300 hover:text-white"><Bookmark size={19}/>我的收藏</Link><Link href="/settings" className="flex items-center gap-3 rounded-xl px-1 py-2.5 text-slate-300 hover:text-white"><Settings size={19}/>设置</Link></section>
    <Link href="/#subscribe" className="block rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/30 to-violet-400/10 p-4"><div className="flex items-center gap-2 text-violet-100"><Sparkles size={18}/><span className="font-medium">订阅更新</span><span className="ml-auto">›</span></div><p className="mt-2 text-sm leading-6 text-slate-300/80">每周发送最新文章和设计资源</p></Link>
  </div>
}

const mobileNav = [{href:'/',Icon:Home,label:'首页'},{href:'/#articles',Icon:Grid2X2,label:'分类'},{href:'/bookmarks',Icon:Bookmark,label:'收藏'},{href:'/about',Icon:UserCircle,label:'我的'}] as const
function MobileNav() { return <>{mobileNav.map(({href,Icon,label}) => <Link key={label} href={href} className="flex min-w-16 flex-col items-center gap-1 py-1 text-[11px] text-slate-400"><Icon size={20}/><span>{label}</span></Link>)}</> }
function MoonIcon() { return <span className="grid h-8 w-8 place-items-center text-xl">☾</span> }
function RightRail() { return <div className="sticky top-24 space-y-4"><section className="glass rounded-2xl p-4"><h3 className="text-lg font-semibold">关于我</h3><p className="mt-3 text-sm leading-6 text-slate-400">热爱设计与技术，专注于产品体验与用户增长。</p><Link href="/about" className="mt-4 block rounded-xl bg-[#5f4de5] py-2.5 text-center text-sm">了解更多 →</Link></section><section className="glass rounded-2xl p-4"><h3 className="font-semibold">热门文章</h3>{['Linear 风格界面设计探索','如何写出打动用户的文案','前端性能优化的 10 个技巧','新媒体发布的节奏与策略','活动运营文案撰写指南'].map((t,i)=><Link href="/posts/linear-style-ui-exploration" key={t} className="flex gap-3 border-b border-white/[.055] py-3 last:border-0"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[.05] text-xs text-violet-200">0{i+1}</span><span className="text-sm leading-5 text-slate-300">{t}<small className="block text-slate-500">{12-i*2} 分钟阅读</small></span></Link>)}</section><Subscribe/></div> }
function Subscribe(){ const [email,setEmail]=useState(''); const [done,setDone]=useState(false); async function submit(){ if(!email.includes('@'))return; await fetch('/api/subscribe',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email})}); setDone(true)}; return <section id="subscribe" className="glass rounded-2xl p-4"><h3 className="font-semibold">订阅更新</h3><p className="mt-2 text-sm leading-6 text-slate-400">获取最新文章和设计资源，每周一次。</p>{done?<div className="mt-4 rounded-xl bg-violet-500/10 p-3 text-sm text-violet-200">已订阅，感谢关注。</div>:<><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="输入你的邮箱" className="mt-4 w-full rounded-xl border border-white/[.07] bg-white/[.025] px-3 py-2.5 text-sm outline-none placeholder:text-slate-600 focus:border-violet-400/40"/><button onClick={submit} className="mt-2.5 w-full rounded-xl bg-[#5f4de5] py-2.5 text-sm font-medium">订阅</button></>}</section> }
function SearchOverlay({onClose}:{onClose:()=>void}){ const [q,setQ]=useState(''); const results=postsFilter(q); return <div className="fixed inset-0 z-[60] bg-[#03060d]/80 p-4 pt-20 backdrop-blur-md" onClick={onClose}><div className="mx-auto max-w-2xl" onClick={e=>e.stopPropagation()}><div className="glass overflow-hidden rounded-2xl"><div className="flex items-center gap-3 border-b border-white/[.06] p-4"><Search size={19} className="text-slate-500"/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="搜索文章…" className="flex-1 bg-transparent text-base outline-none"/><button onClick={onClose}><X size={18}/></button></div>{q && <div className="max-h-[60vh] overflow-auto">{results.map(p=><Link onClick={onClose} href={`/posts/${p.slug}`} key={p.slug} className="block border-b border-white/[.05] p-4 last:border-0 hover:bg-white/[.03]"><div className="text-sm text-violet-300">{p.category.label}</div><div className="mt-1 font-medium">{p.title}</div><div className="mt-1 text-sm text-slate-500">{p.excerpt}</div></Link>)}</div>}</div></div></div> }
function postsFilter(q:string){ return q ? posts.filter(p=>`${p.title} ${p.excerpt}`.toLowerCase().includes(q.toLowerCase())) : [] }
