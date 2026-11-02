export type CloudSource={id:string;title:string;url:string;excerpt:string;fetchedAt:string};
export type CloudReply={text:string;sources:CloudSource[];searchStatus:string};
export async function loadAdvisorEndpoint():Promise<string>{
 try{const r=await fetch(new URL('./runtime-config.json',document.baseURI),{cache:'no-store'});if(!r.ok)return '';const d:any=await r.json();if(!d||typeof d.advisorEndpoint!=='string'||!d.advisorEndpoint)return '';const u=new URL(d.advisorEndpoint,document.baseURI);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}
}
export async function askCloudAdvisor(endpoint:string,body:Record<string,unknown>,signal:AbortSignal):Promise<CloudReply>{
 const timeout=AbortSignal.timeout(40000);const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.any([signal,timeout])});
 const data:any=await r.json();if(!data||!r.ok)throw new Error(typeof data?.message==='string'?data.message:'云端顾问暂时不可用');
 if(typeof data.text!=='string'||!data.text.trim()||data.text.length>12000)throw new Error('顾问回复格式有误');
 return {text:data.text,sources:Array.isArray(data.sources)?data.sources.filter((s:any)=>typeof s.url==='string'&&/^https:\/\//.test(s.url)&&typeof s.title==='string').slice(0,6):[],searchStatus:data.searchStatus};
}
