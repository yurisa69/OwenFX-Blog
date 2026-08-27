import { ExternalLink, Github } from 'lucide-react'
import { SectionTitle } from '@/components/section-title'
const projects=[
 {name:'OwenFX Blog',desc:'Next.js + Supabase + Cloudflare R2 的个人博客系统。',stack:'Next.js / Supabase / R2',url:'#'},
 {name:'Software Station',desc:'软件与开源项目导航，支持 SEO、资源卡片与多平台下载。',stack:'Next.js / R2 / Cloudflare',url:'#'},
 {name:'Cross-border Tools',desc:'面向跨境互联网创作者的工具与教程集合。',stack:'React / API / Edge',url:'#'},
]
export default function ProjectsPage(){return <div><SectionTitle eyebrow="Works" title="项目"/><div className="grid gap-4 md:grid-cols-2">{projects.map(p=><div key={p.name} className="glass rounded-3xl p-5"><div className="mb-8 flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-200">◫</span><div className="flex gap-1"><a href={p.url} className="rounded-lg p-2 text-slate-500 hover:bg-white/[.05] hover:text-white"><Github size={18}/></a><a href={p.url} className="rounded-lg p-2 text-slate-500 hover:bg-white/[.05] hover:text-white"><ExternalLink size={18}/></a></div></div><h2 className="text-xl font-semibold">{p.name}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{p.desc}</p><div className="mt-5 text-xs text-slate-500">{p.stack}</div></div>)}</div></div>}
