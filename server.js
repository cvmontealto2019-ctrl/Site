require('dotenv').config();
const express = require('express'), session = require('express-session'), multer = require('multer'), path = require('path'), fs = require('fs');
const app = express();
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname,'data');
const DATA_FILE = path.join(DATA_DIR,'store.json');
const SEED_FILE = path.join(__dirname,'data','store.json');
if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true});
function load(){ if(!fs.existsSync(DATA_FILE)) fs.copyFileSync(SEED_FILE, DATA_FILE); return JSON.parse(fs.readFileSync(DATA_FILE,'utf8')); }
function save(d){ fs.writeFileSync(DATA_FILE, JSON.stringify(d,null,2)); }
let data = load();
app.set('view engine','ejs'); app.set('views', path.join(__dirname,'views'));
app.use(express.urlencoded({extended:true})); app.use(express.json()); app.use('/public', express.static(path.join(__dirname,'public')));
app.use(session({secret:process.env.SESSION_SECRET||'biruta-dev', resave:false, saveUninitialized:false, cookie:{maxAge:1000*60*60*24*7}}));
const uploadDir = path.join(__dirname,'public','uploads'); if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir,{recursive:true});
const upload = multer({storage: multer.diskStorage({destination:uploadDir, filename:(req,file,cb)=>cb(null,Date.now()+'-'+file.originalname.replace(/\s+/g,'-'))})});
const money = v => Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function admin(req,res,next){ if(req.session.user) return next(); res.redirect('/admin/login'); }
function packYear(p){ const y=data.budget_years.find(y=>y.id==p.year_id); return {...p, year:y?.year}; }
app.use((req,res,next)=>{data=load(); res.locals.money=money; res.locals.s=data.settings||{}; next();});

app.get('/', (req,res)=>{ const banners=data.banners.filter(b=>b.active).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)); const promo=data.promotions.filter(p=>p.active&&p.highlight).at(-1); const activeYears=data.budget_years.filter(y=>y.active).map(y=>y.id); const packs=data.packages.filter(p=>p.active&&activeYears.includes(p.year_id)).map(packYear).sort((a,b)=>b.year-a.year||a.sort_order-b.sort_order).slice(0,7); const deps=(data.testimonials||[]).filter(d=>d.active).slice(0,3); res.render('index',{banners,promo,packs,deps}); });
app.get('/promocoes', (req,res)=>{ const promos=[...data.promotions].sort((a,b)=>Number(b.active)-Number(a.active)); res.render('promocoes',{promos}); });
app.get('/orcamento', (req,res)=>{ res.render('orcamento',{years:data.budget_years.sort((a,b)=>a.year-b.year)}); });
app.get('/api/packages', (req,res)=>{ const year=Number(req.query.year); const y=data.budget_years.find(y=>y.year===year && y.active); if(!y) return res.json([]); res.json(data.packages.filter(p=>p.year_id===y.id && p.active).map(packYear).sort((a,b)=>a.sort_order-b.sort_order)); });
app.post('/api/leads',(req,res)=>{ const {name,whatsapp,birthday_name,birthday_age,event_date,guests,event_type,wants_food,selected_package_id}=req.body; const p0=data.packages.find(p=>p.id==selected_package_id); if(!p0) return res.status(400).json({error:'Pacote inválido'}); const p=packYear(p0); const g=Number(guests||0); const lead={id:data.next.lead++,name,whatsapp,birthday_name,birthday_age,event_date,guests:g,event_type,wants_food,selected_package_id:Number(selected_package_id),year:p.year,status:'novo',notes:'',created_at:new Date().toISOString()}; data.leads.unshift(lead); save(data); const msg=`Olá! Fiz uma solicitação de orçamento pelo site do Biruta Park.\n\nNome: ${name}\nWhatsApp: ${whatsapp}\nAniversariante: ${birthday_name||''}${birthday_age?' - '+birthday_age+' anos':''}\nData desejada: ${event_date||''}\nQuantidade aproximada de convidados: ${g}\nTipo de festa: ${event_type||''}\nPreferência: ${wants_food||''}\nPacote de interesse: ${p.name} (${p.subtitle||p.base_people+' pessoas'})\n\nGostaria de receber valores, disponibilidade e mais detalhes.`; res.json({lead,package:p,whatsapp_url:`https://wa.me/${data.settings.whatsapp||'5516997913686'}?text=${encodeURIComponent(msg)}`}); });

app.get('/admin/login',(req,res)=>res.render('admin-login',{error:null}));
app.post('/admin/login',(req,res)=>{ const u=data.users.find(u=>u.email===req.body.email); if(u && req.body.password===u.password){req.session.user={id:u.id,email:u.email}; return res.redirect('/admin')} res.render('admin-login',{error:'Login ou senha inválidos'}); });
app.get('/admin/logout',(req,res)=>req.session.destroy(()=>res.redirect('/admin/login')));
app.get('/admin',admin,(req,res)=>{ const leads=data.leads.slice(0,20).map(l=>({...l,package_name:data.packages.find(p=>p.id==l.selected_package_id)?.name||''})); res.render('admin',{page:'dashboard',leads,counts:[]}); });
app.get('/admin/senha',admin,(req,res)=>res.render('admin',{page:'senha',error:null,ok:null}));
app.post('/admin/senha',admin,(req,res)=>{ const u=data.users.find(u=>u.id===req.session.user.id); if(!u || req.body.current_password!==u.password) return res.render('admin',{page:'senha',error:'Senha atual incorreta.',ok:null}); if(!req.body.new_password || req.body.new_password.length<6) return res.render('admin',{page:'senha',error:'A nova senha precisa ter pelo menos 6 caracteres.',ok:null}); if(req.body.new_password!==req.body.confirm_password) return res.render('admin',{page:'senha',error:'A confirmação não confere.',ok:null}); u.password=req.body.new_password; save(data); res.render('admin',{page:'senha',error:null,ok:'Senha alterada com sucesso.'}); });
app.get('/admin/orcamentos',admin,(req,res)=>{ const yrs=[...data.budget_years].sort((a,b)=>a.year-b.year); const packs=data.packages.map(packYear).sort((a,b)=>b.year-a.year||a.sort_order-b.sort_order); res.render('admin',{page:'orcamentos',yrs,packs}); });
app.post('/admin/year',admin,(req,res)=>{ const year=Number(req.body.year); let y=data.budget_years.find(y=>y.year===year); if(y) y.active=!!req.body.active; else data.budget_years.push({id:data.next.year++,year,active:!!req.body.active}); save(data); res.redirect('/admin/orcamentos'); });
app.post('/admin/year/:id/toggle',admin,(req,res)=>{ const y=data.budget_years.find(y=>y.id==req.params.id); if(y) y.active=!y.active; save(data); res.redirect('/admin/orcamentos'); });
app.post('/admin/package',admin,(req,res)=>{ const b=req.body; const obj={year_id:Number(b.year_id),name:b.name,subtitle:b.subtitle,base_people:Number(b.base_people),base_price:Number(b.base_price),card_price:b.card_price?Number(b.card_price):null,additional_price:Number(b.additional_price),duration:b.duration,availability:b.availability,included:b.included,menu_details:b.menu_details,rules:b.rules,active:!!b.active,featured:!!b.featured,sort_order:data.packages.length+1}; if(b.id){ const idx=data.packages.findIndex(p=>p.id==b.id); if(idx>=0) data.packages[idx]={...data.packages[idx],...obj}; } else data.packages.push({id:data.next.package++,...obj}); save(data); res.redirect('/admin/orcamentos'); });
app.post('/admin/package/:id/delete',admin,(req,res)=>{ data.packages=data.packages.filter(p=>p.id!=req.params.id); save(data); res.redirect('/admin/orcamentos'); });
app.get('/admin/site',admin,(req,res)=>{ const banners=[...data.banners].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)); const promos=[...data.promotions].reverse(); res.render('admin',{page:'site',banners,promos}); });
app.post('/admin/settings',admin,(req,res)=>{ data.settings={...data.settings,...req.body}; save(data); res.redirect('/admin/site'); });
app.post('/admin/banner',admin,upload.single('image'),(req,res)=>{ const image=req.file?'/public/uploads/'+req.file.filename:req.body.image_url||''; data.banners.push({id:data.next.banner++,title:req.body.title,subtitle:req.body.subtitle,button_text:req.body.button_text,button_link:req.body.button_link,image_url:image,active:!!req.body.active,sort_order:Number(req.body.sort_order||0)}); save(data); res.redirect('/admin/site'); });
app.post('/admin/promotion',admin,upload.single('image'),(req,res)=>{ const image=req.file?'/public/uploads/'+req.file.filename:req.body.image_url||''; data.promotions.push({id:data.next.promotion++,title:req.body.title,description:req.body.description,button_text:req.body.button_text,link:req.body.link,image_url:image,starts_at:req.body.starts_at||null,ends_at:req.body.ends_at||null,active:!!req.body.active,highlight:!!req.body.highlight}); save(data); res.redirect('/admin/site'); });
app.get('/admin/leads',admin,(req,res)=>{ const leads=data.leads.map(l=>({...l,package_name:data.packages.find(p=>p.id==l.selected_package_id)?.name||''})); res.render('admin',{page:'leads',leads}); });
app.post('/admin/leads/:id/status',admin,(req,res)=>{ const l=data.leads.find(l=>l.id==req.params.id); if(l){l.status=req.body.status; l.notes=req.body.notes;} save(data); res.redirect('/admin/leads'); });
app.get('/health',(req,res)=>res.send('ok'));
app.listen(process.env.PORT||3000,()=>console.log('Biruta Park online na porta '+(process.env.PORT||3000)));
