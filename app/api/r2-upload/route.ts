import { NextResponse } from 'next/server'
import { uploadToR2 } from '@/lib/r2'
export const runtime='nodejs'
export async function POST(req:Request){try{const fd=await req.formData();const file=fd.get('file');if(!(file instanceof File))return NextResponse.json({error:'file required'},{status:400});if(file.size>10*1024*1024)return NextResponse.json({error:'文件不能超过 10MB'},{status:400});const bytes=new Uint8Array(await file.arrayBuffer());const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'-');const key=`uploads/${Date.now()}-${safe}`;const url=await uploadToR2(key,bytes,file.type||'application/octet-stream');return NextResponse.json({ok:true,url,key})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'R2 upload failed'},{status:500})}}
