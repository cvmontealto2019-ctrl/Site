(function(){
const el=document.getElementById('stepper'); if(!el) return;
let step=0, state={}, packages=[];
const WHATS='5516997913686';
const screens=[
 {key:'name', title:'Oi! Vamos preparar sua solicitação?', sub:'Primeiro, me conta seu nome.', input:'text', placeholder:'Seu nome completo'},
 {key:'whatsapp', title:()=>`Perfeito, ${state.name||''}!`, sub:'Informe seu WhatsApp para nossa equipe retornar com o orçamento.', input:'tel', placeholder:'(16) 99999-9999'},
 {key:'birthday_name', title:'Qual o nome do aniversariante?', sub:'Assim deixamos o atendimento mais personalizado.', input:'text', placeholder:'Nome do aniversariante'},
 {key:'birthday_age', title:()=>`Que idade ${state.birthday_name||'o aniversariante'} vai fazer?`, sub:'Pode colocar só o número.', input:'text', placeholder:'Ex: 5 anos'},
 {key:'event_date', title:'Qual a data desejada para a festa?', sub:'', input:'date'},
 {key:'guests', title:'Quantos convidados no total?', sub:'Pode ser uma estimativa.', input:'number', placeholder:'Ex: 80'},
 {key:'adults', title:'Desses convidados, quantos são adultos?', sub:'Informe uma quantidade aproximada.', input:'number', placeholder:'Ex: 45'},
 {key:'kids_0_5', title:'Quantas crianças são de 0 a 5 anos?', sub:'Pode ser uma estimativa.', input:'number', placeholder:'Ex: 15'},
 {key:'kids_6_10', title:'E quantas crianças são de 6 a 10 anos?', sub:'Pode ser uma estimativa.', input:'number', placeholder:'Ex: 20'},
 {key:'event_type', title:'Qual tipo de festa?', sub:'Escolha a opção mais próxima.', options:['Aniversário infantil','Chá revelação','Aniversário adulto','Evento escolar','Ainda estou decidindo']},
 {key:'wants_food', title:'Você tem preferência de pacote?', sub:'Isso ajuda nossa equipe a indicar a melhor opção.', options:['Quero algo mais econômico','Quero com massa','Quero com pizza / pega pizza','Quero completo premium','Quero ver todos']},
 {key:'package', title:'Escolha o pacote que mais combina com sua festa', sub:'Clique no pacote para ver os inclusos e conversar com nossa equipe.'}
];
function title(s){return typeof s.title==='function'?s.title():s.title}
function setProgress(){document.querySelector('.progress i').style.width=Math.round(((step+1)/screens.length)*100)+'%'}
function btns(back=true){return `<div class="actions">${back?'<button class="btn ghost" onclick="Q.back()">Voltar</button>':''}<button class="btn" onclick="Q.next()">Continuar</button></div>`}
function renderCats(cats){ if(!cats) return ''; if(typeof cats==='string') {try{cats=JSON.parse(cats)}catch(e){return `<p>${cats}</p>`}} return Object.entries(cats).map(([k,items])=>`<div class="cat"><h4>${k}</h4><ul>${(items||[]).map(i=>`<li>${i}</li>`).join('')}</ul></div>`).join(''); }
async function loadPackages(){ const y=new Date(state.event_date).getFullYear(); state.year=y; const r=await fetch('/api/packages?year='+y); packages=await r.json(); }
function render(){setProgress(); const s=screens[step]; let html=`<div class="q"><span class="pill">Orçamento online</span><h1>${title(s)}</h1>${s.sub?`<p>${s.sub}</p>`:''}`;
 if(s.key==='package') { if(!packages.length){ const msg=encodeURIComponent('Olá, gostaria de um orçamento!'); html+=`<div class="result"><h3>Orçamento indisponível para ${state.year}</h3><p>Esse ano ainda não está ativo. Fale com nossa equipe no WhatsApp.</p></div><a class="btn" href="https://wa.me/${WHATS}?text=${msg}">Chamar no WhatsApp</a>`; el.innerHTML=html+'</div>'; return; }
 html+=packages.map(p=>`<div class="package-option"><h3>${p.name}</h3><p><b>${p.subtitle||''}</b> • ${p.duration||''} • ${p.availability||''}</p><p>${p.included||''}</p><details><summary>Ver cardápio e inclusos</summary><div class="menu-details">${renderCats(p.categories)||String(p.menu_details||'').replace(/\n/g,'<br>')}</div></details><button class="btn" onclick="Q.selectPackage('${p.id}')">Conversar com a equipe</button></div>`).join(''); html+=`<button class="btn ghost" onclick="Q.back()">Voltar</button>`; el.innerHTML=html+'</div>'; return; }
 if(s.options) html+=s.options.map(o=>`<button class="package-option" onclick="Q.pick('${s.key}','${o.replace(/'/g,"\\'")}')">${o}</button>`).join('')+`<button class="btn ghost" onclick="Q.back()">Voltar</button>`;
 else html+=`<input id="field" type="${s.input}" placeholder="${s.placeholder||''}" value="${state[s.key]||''}">${btns(step>0)}`;
 el.innerHTML=html+'</div>'; const f=document.getElementById('field'); if(f) f.focus(); }
window.Q={
 next:async()=>{const s=screens[step]; const f=document.getElementById('field'); if(f&&!f.value.trim()){f.focus();return} if(f) state[s.key]=f.value.trim(); if(s.key==='event_date') await loadPackages(); step=Math.min(step+1,screens.length-1); render();},
 back:()=>{step=Math.max(0,step-1); render()},
 pick:(k,v)=>{state[k]=v; step++; render()},
 selectPackage:async(id)=>{state.selected_package_id=id; const r=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)}); const data=await r.json(); const p=data.package; el.innerHTML=`<div class="q"><span class="pill">Solicitação pronta</span><h1>${state.name}, agora é só enviar para nossa equipe!</h1><div class="result"><h3>${p.name}</h3><p><b>${p.subtitle||''}</b> • ${p.duration||''}</p><small>Nossa equipe vai conferir disponibilidade, detalhes do pacote e valores diretamente pelo WhatsApp.</small></div><a class="btn" href="${data.whatsapp_url}">Conversar no WhatsApp</a><button class="btn ghost" onclick="location.reload()">Nova solicitação</button></div>`; document.querySelector('.progress i').style.width='100%';}
}; render();
})();
