require('dotenv').config();
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

const DEFAULT_THEMES = [
' DE FORA','A BELA E A FERA','Á DECIDIR','ALICE NO PAÍS DAS MARAVILHAS','ANOS OITENTA','ARLEQUINA','ASTRONAUTA','BABY SHARK','BAILARINA','BARBIE','BLUEY','BOIADEIRA','BOLOFOFOS','BONECA METOO','BORBOLETA','BRANCA DE NEVE','CARROS','CHÁ DE BEBE','CHÁ REVELAÇÃO','CHAPEUZINHO VERMELHO','CHAVES','CINDERELA','CIRCO','CIRCO ROSA','CONFEITARIA','CONSTRUÇÃO','CÚMPLICES DE UM RESGATE','DINO BABY','DINOSSAUROS','DRAGON BALL','ENCANTO','FAZENDINHA','FAZENDINHA ROSA','FROZEN','FUNDO DO MAR','FUTEBOL','FUTEBOL BRASIL','GUERREIRAS DO KPOP','HALLOWEEN','HARRY POTTER','HEROIS','HERÓIS','HOMEM ARANHA','HOTWHEELS','JARDIM ENCANTADO','LADY BUG','LEGO','MAGALI','MASHA E O URSO','MICKEY','MINECRAFT','MINIONS','MINNEY','MINNIE ROSA','MOANA','MULHER MARAVILHA','MUNDO BITA','NÃO TERÁ','NARUTO','NEON','NOW UNITED','ONE PIECE','PANDA','PATRULHA CANINA','PEPPA PIG','PEQUENA SEREIA','PEQUENO PRINCIPE','PJ MASKS','POKEMON','POP IT','PRINCESAS','ROBLOX','SAFARI','SAFARI DO MICKEY','SEREIA','SONIC','STITCH','SUPER MÁRIO','TIK TOK','TIME: CORINTHIANS','TIME: PALMEIRAS','TIME: SANTOS','TIME: SÃO PAULO','TINKERBELL','TOY STORY','TURMA DA DISNEY','TURMA DA MÔNICA','UNICÓRNIO','URSAS','URSINHO POOH','VINGADORES','WANDINHA'
];

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
function load() {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({settings:{}, users:[], packages:[], banners:[], promotions:[], testimonials:[], leads:[], agenda_events:[], themes:[], next:{}}, null, 2));
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}
function save(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }
function ensureData(d){
  d.settings ||= {};
  d.users ||= [{id:1, login:'17717592000160', email:'admin@birutapark.com.br', password:'Biruta@2026', name:'Biruta Park'}];
  d.packages ||= []; d.banners ||= []; d.promotions ||= []; d.testimonials ||= []; d.leads ||= [];
  d.agenda_events ||= []; d.themes ||= DEFAULT_THEMES;
  d.next ||= {};
  d.next.package ||= 1; d.next.banner ||= 1; d.next.promotion ||= 1; d.next.testimonial ||= 1; d.next.lead ||= 1; d.next.agenda ||= 1; d.next.user ||= (Math.max(0,...d.users.map(u=>u.id||0))+1);
  return d;
}
let data = ensureData(load()); save(data);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(session({ secret: process.env.SESSION_SECRET || 'biruta-site', resave: false, saveUninitialized: false, cookie: { maxAge: 1000*60*60*24*7 } }));

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ storage: multer.diskStorage({ destination: uploadDir, filename: (req,file,cb)=>cb(null, Date.now()+'-'+file.originalname.replace(/\s+/g,'-')) }) });
const admin = (req,res,next)=> req.session.user ? next() : res.redirect('/admin/login');
const agendaAuth = (req,res,next)=> req.session.user ? next() : res.redirect('/agendamonise/login');
const cleanPhone = v => String(v||'').replace(/\D/g,'');
const whatsUrl = (phone, text='') => `https://wa.me/${cleanPhone(phone).startsWith('55')?cleanPhone(phone):'55'+cleanPhone(phone)}${text ? '?text='+encodeURIComponent(text):''}`;
const promoLink = link => { const l=String(link||'').trim(); if(!l)return '#'; if(l.startsWith('http://')||l.startsWith('https://')||l.startsWith('/')||l.startsWith('#'))return l; if(l.includes('.'))return 'https://'+l; return l; };
const instagramLink = link => { const l=String(link||'').trim(); if(!l)return 'https://www.instagram.com/_buffetbirutapark/'; if(l.startsWith('http'))return l; return 'https://www.instagram.com/'+l.replace('@','').replace(/^instagram\.com\//,'').replace(/\/$/,'')+'/'; };
const categoriesOrder = ['ENTRADAS','LANCHES','SALGADOS ASSADOS','SALGADOS FRITOS','BOLO','DOCINHOS','BEBIDAS','E MAIS','ENTRADA DO(A) ANIVERSARIANTE'];

app.use((req,res,next)=>{ data = ensureData(load()); res.locals.s=data.settings||{}; res.locals.current_user=req.session.user||null; res.locals.promoLink=promoLink; res.locals.instagramLink=instagramLink; res.locals.categoriesOrder=categoriesOrder; res.locals.whatsUrl=whatsUrl; next(); });

app.get('/', (req,res)=>{ const banners=(data.banners||[]).filter(b=>b.active).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)); const promos=(data.promotions||[]).filter(p=>p.active&&p.highlight); const packs=(data.packages||[]).filter(p=>p.active).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)); const deps=(data.testimonials||[]).filter(d=>d.active).slice(0,6); res.render('index',{banners,promo:promos.at(-1),packs,deps}); });
app.get('/promocoes', (req,res)=>res.render('promocoes',{promos:[...(data.promotions||[])].reverse()}));
app.get('/orcamento', (req,res)=>res.render('orcamento'));
app.get('/comparativo', (req,res)=>{ const packs=(data.packages||[]).filter(p=>p.active).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)); res.render('comparativo',{packs}); });
app.get('/api/packages', (req,res)=>res.json((data.packages||[]).filter(p=>p.active).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))));
app.post('/api/leads', (req,res)=>{ const p=(data.packages||[]).find(p=>p.id==req.body.selected_package_id); if(!p)return res.status(400).json({error:'Pacote inválido'}); const lead={ id:data.next.lead++, name:req.body.name||'', whatsapp:req.body.whatsapp||'', birthday_name:req.body.birthday_name||'', birthday_age:req.body.birthday_age||'', event_date:req.body.event_date||'', guests:Number(req.body.guests||0), adults:Number(req.body.adults||0), kids_0_5:Number(req.body.kids_0_5||0), kids_6_10:Number(req.body.kids_6_10||0), event_type:req.body.event_type||'', wants_food:req.body.wants_food||'', selected_package_id:Number(p.id), status:'novo', notes:'', created_at:new Date().toISOString()}; data.leads.unshift(lead); save(data); const msg=`Olá! Gostaria de um orçamento pelo site do Biruta Park.\n\nNome: ${lead.name}\nWhatsApp: ${lead.whatsapp}\nAniversariante: ${lead.birthday_name}${lead.birthday_age?' - '+lead.birthday_age+' anos':''}\nData desejada: ${lead.event_date}\nTotal de convidados: ${lead.guests}\nAdultos: ${lead.adults}\nCrianças de 0 a 5 anos: ${lead.kids_0_5}\nCrianças de 6 a 10 anos: ${lead.kids_6_10}\nTipo de festa: ${lead.event_type}\nPreferência: ${lead.wants_food}\nPacote de interesse: ${p.name} - ${p.subtitle||''}\n\nPodem me passar valores, disponibilidade e detalhes?`; res.json({lead,package:p,whatsapp_url:whatsUrl(data.settings.whatsapp||'5516997913686', msg)}); });

// Login/admin
app.get('/admin/login',(req,res)=>res.render('admin-login',{error:null, mode:'admin'}));
app.post('/admin/login',(req,res)=>{ const u=(data.users||[]).find(u=>u.login===req.body.login||u.email===req.body.login); if(u&&req.body.password===u.password){req.session.user={id:u.id,login:u.login,email:u.email,name:u.name}; return res.redirect('/admin');} res.render('admin-login',{error:'Login ou senha inválidos', mode:'admin'}); });
app.get('/admin/logout',(req,res)=>req.session.destroy(()=>res.redirect('/admin/login')));
app.get('/admin',admin,(req,res)=>{ const leads=(data.leads||[]).slice(0,12).map(l=>({...l,package_name:data.packages.find(p=>p.id==l.selected_package_id)?.name||''})); res.render('admin',{page:'dashboard',leads}); });
app.get('/admin/senha',admin,(req,res)=>res.render('admin',{page:'senha',error:null,ok:null}));
app.post('/admin/senha',admin,(req,res)=>{ const u=data.users.find(u=>u.id===req.session.user.id); if(!u||req.body.current_password!==u.password)return res.render('admin',{page:'senha',error:'Senha atual incorreta.',ok:null}); if(!req.body.new_password||req.body.new_password.length<6)return res.render('admin',{page:'senha',error:'A nova senha precisa ter pelo menos 6 caracteres.',ok:null}); if(req.body.new_password!==req.body.confirm_password)return res.render('admin',{page:'senha',error:'A confirmação não confere.',ok:null}); u.login=(req.body.new_login||u.login).trim(); u.password=req.body.new_password; u.name=req.body.name||u.name; save(data); req.session.user={id:u.id,login:u.login,email:u.email,name:u.name}; res.render('admin',{page:'senha',error:null,ok:'Login e senha atualizados com sucesso.'}); });
app.get('/admin/usuarios',admin,(req,res)=>res.render('admin',{page:'usuarios',users:data.users||[]}));
app.post('/admin/user',admin,(req,res)=>{ const obj={name:req.body.name||'', login:req.body.login||'', email:req.body.email||'', password:req.body.password||'123456'}; if(req.body.id){ const u=data.users.find(u=>u.id==req.body.id); if(u){ u.name=obj.name; u.login=obj.login; u.email=obj.email; if(req.body.password)u.password=req.body.password; } } else data.users.push({id:data.next.user++,...obj}); save(data); res.redirect('/admin/usuarios'); });
app.post('/admin/user/:id/delete',admin,(req,res)=>{ if(Number(req.params.id)!==req.session.user.id) data.users=data.users.filter(u=>u.id!=req.params.id); save(data); res.redirect('/admin/usuarios'); });

// Pacotes/admin
app.get('/admin/pacotes',admin,(req,res)=>{ const packs=[...(data.packages||[])].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)); res.render('admin',{page:'pacotes',packs}); });
app.post('/admin/package',admin,(req,res)=>{ let categories={}; try{categories=JSON.parse(req.body.categories_json||'{}')}catch(e){categories={}} const obj={name:req.body.name,subtitle:req.body.subtitle,base_people:Number(req.body.base_people||0),duration:req.body.duration,availability:req.body.availability,summary:req.body.summary,rules:req.body.rules,categories,active:!!req.body.active,featured:!!req.body.featured,sort_order:Number(req.body.sort_order||99)}; if(req.body.id){const idx=data.packages.findIndex(p=>p.id==req.body.id); if(idx>=0)data.packages[idx]={...data.packages[idx],...obj};} else data.packages.push({id:data.next.package++,...obj}); save(data); res.redirect('/admin/pacotes'); });
app.post('/admin/package/:id/delete',admin,(req,res)=>{data.packages=data.packages.filter(p=>p.id!=req.params.id); save(data); res.redirect('/admin/pacotes');});

app.get('/admin/site',admin,(req,res)=>res.render('admin',{page:'site',banners:data.banners||[],promos:data.promotions||[],testimonials:data.testimonials||[]}));
app.post('/admin/settings',admin,upload.fields([{name:'logo',maxCount:1},{name:'favicon',maxCount:1}]),(req,res)=>{data.settings={...data.settings,...req.body}; if(req.files?.logo)data.settings.logo_url='/public/uploads/'+req.files.logo[0].filename; if(req.files?.favicon)data.settings.favicon_url='/public/uploads/'+req.files.favicon[0].filename; save(data); res.redirect('/admin/site');});
app.post('/admin/banner',admin,upload.single('image'),(req,res)=>{const image=req.file?'/public/uploads/'+req.file.filename:req.body.image_url||''; const obj={title:req.body.title,subtitle:req.body.subtitle,button_text:req.body.button_text,button_link:promoLink(req.body.button_link),image_url:image,active:!!req.body.active,sort_order:Number(req.body.sort_order||0)}; if(req.body.id){const b=data.banners.find(b=>b.id==req.body.id); if(b)Object.assign(b,{...obj,image_url:image||b.image_url});} else data.banners.push({id:data.next.banner++,...obj}); save(data); res.redirect('/admin/site#banners-admin');});
app.post('/admin/banner/:id/delete',admin,(req,res)=>{data.banners=data.banners.filter(b=>b.id!=req.params.id); save(data); res.redirect('/admin/site#banners-admin');});
app.post('/admin/promotion',admin,upload.single('image'),(req,res)=>{const image=req.file?'/public/uploads/'+req.file.filename:req.body.image_url||''; const obj={title:req.body.title,description:req.body.description,button_text:req.body.button_text,link:promoLink(req.body.link),image_url:image,starts_at:req.body.starts_at||null,ends_at:req.body.ends_at||null,active:!!req.body.active,highlight:!!req.body.highlight}; if(req.body.id){const p=data.promotions.find(p=>p.id==req.body.id); if(p)Object.assign(p,{...obj,image_url:image||p.image_url});} else data.promotions.push({id:data.next.promotion++,...obj}); save(data); res.redirect('/admin/site#promocoes-admin');});
app.post('/admin/promotion/:id/delete',admin,(req,res)=>{data.promotions=data.promotions.filter(p=>p.id!=req.params.id); save(data); res.redirect('/admin/site#promocoes-admin');});
app.post('/admin/testimonial',admin,(req,res)=>{const obj={name:req.body.name,text:req.body.text,active:!!req.body.active}; if(req.body.id){const t=data.testimonials.find(t=>t.id==req.body.id); if(t)Object.assign(t,obj);} else data.testimonials.push({id:data.next.testimonial++,...obj}); save(data); res.redirect('/admin/site#depoimentos-admin');});
app.post('/admin/testimonial/:id/delete',admin,(req,res)=>{data.testimonials=data.testimonials.filter(t=>t.id!=req.params.id); save(data); res.redirect('/admin/site#depoimentos-admin');});
app.get('/admin/leads',admin,(req,res)=>{const leads=(data.leads||[]).map(l=>({...l,package_name:data.packages.find(p=>p.id==l.selected_package_id)?.name||''})); res.render('admin',{page:'leads',leads});});
app.post('/admin/leads/:id/status',admin,(req,res)=>{const l=data.leads.find(l=>l.id==req.params.id); if(l){l.status=req.body.status;l.notes=req.body.notes;} save(data); res.redirect('/admin/leads');});

// Agenda Monise
app.get('/agendamonise/login',(req,res)=>res.render('admin-login',{error:null, mode:'agenda'}));
app.post('/agendamonise/login',(req,res)=>{ const u=(data.users||[]).find(u=>u.login===req.body.login||u.email===req.body.login); if(u&&req.body.password===u.password){req.session.user={id:u.id,login:u.login,email:u.email,name:u.name}; return res.redirect('/agendamonise');} res.render('admin-login',{error:'Login ou senha inválidos', mode:'agenda'}); });
app.get('/agendamonise',agendaAuth,(req,res)=>{ const today=new Date(); const year=Number(req.query.year||today.getFullYear()); const month=Number(req.query.month||today.getMonth()+1); res.render('agenda',{year,month,events:data.agenda_events||[],themes:data.themes||[],saved:req.query.saved}); });
app.get('/agendamonise/dia/:date',agendaAuth,(req,res)=>{ const date=req.params.date; const events=(data.agenda_events||[]).filter(e=>e.date===date).sort((a,b)=>(a.created_at||'').localeCompare(b.created_at||'')); res.render('agenda-day',{date,events,themes:data.themes||[], edit:null}); });
app.get('/agendamonise/editar/:id',agendaAuth,(req,res)=>{ const ev=(data.agenda_events||[]).find(e=>e.id==req.params.id); if(!ev)return res.redirect('/agendamonise'); const events=(data.agenda_events||[]).filter(e=>e.date===ev.date).sort((a,b)=>(a.created_at||'').localeCompare(b.created_at||'')); res.render('agenda-day',{date:ev.date,events,themes:data.themes||[],edit:ev}); });
app.post('/agendamonise/salvar',agendaAuth,(req,res)=>{ let theme=req.body.theme||''; const custom=(req.body.custom_theme||'').trim(); if(theme==='PERSONALIZADO'&&custom){ theme=custom.toUpperCase(); if(!data.themes.includes(theme)) data.themes.push(theme); }
  const obj={ date:req.body.date, responsible_name:req.body.responsible_name||'', whatsapp:req.body.whatsapp||'', birthday_name:req.body.birthday_name||'', birthday_age:req.body.birthday_age||'', has_arch:req.body.has_arch||'Não', theme, notes:req.body.notes||'', updated_at:new Date().toISOString() };
  if(req.body.id){ const ev=data.agenda_events.find(e=>e.id==req.body.id); if(ev)Object.assign(ev,obj); }
  else data.agenda_events.push({id:data.next.agenda++,...obj,created_at:new Date().toISOString()});
  save(data); const [y,m]=obj.date.split('-'); res.redirect(`/agendamonise?year=${Number(y)}&month=${Number(m)}&saved=1`);
});
app.post('/agendamonise/excluir/:id',agendaAuth,(req,res)=>{ const ev=data.agenda_events.find(e=>e.id==req.params.id); data.agenda_events=data.agenda_events.filter(e=>e.id!=req.params.id); save(data); if(ev){const [y,m]=ev.date.split('-'); return res.redirect(`/agendamonise?year=${Number(y)}&month=${Number(m)}&saved=1`);} res.redirect('/agendamonise');});

app.get('/health',(req,res)=>res.send('ok'));
app.listen(process.env.PORT||3000,()=>console.log('Biruta Park online'));
