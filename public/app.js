(function(){
const el=document.getElementById('stepper'); if(!el) return;
const years=window.BUDGET_YEARS||[]; let step=0, state={}; let packages=[];
const fmt=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const screens=[
 {key:'name', title:'Oi! Vamos montar seu orçamento?', sub:'Primeiro, me conta seu nome.', input:'text', placeholder:'Seu nome completo'},
 {key:'whatsapp', title:()=>`Perfeito, ${state.name||''}!`, sub:'Agora informe seu WhatsApp para liberar o orçamento personalizado.', input:'tel', placeholder:'(16) 99999-9999'},
 {key:'birthday_name', title:'Qual o nome do aniversariante?', sub:'Assim deixamos tudo mais personalizado.', input:'text', placeholder:'Nome do aniversariante'},
 {key:'birthday_age', title:()=>`Que idade ${state.birthday_name||'o aniversariante'} vai fazer?`, sub:'Pode colocar só o número.', input:'text', placeholder:'Ex: 5 anos'},
 {key:'event_date', title:'Qual a data desejada para a festa?', sub:'Vamos usar o ano da data para buscar o orçamento certo.', input:'date'},
 {key:'guests', title:'Quantos convidados aproximadamente?', sub:'O sistema calcula adicionais automaticamente.', input:'number', placeholder:'Ex: 80'},
 {key:'event_type', title:'Qual tipo de festa?', sub:'Escolha a opção mais próxima.', options:['Aniversário infantil','Chá revelação','Aniversário adulto','Evento escolar','Ainda estou decidindo']},
 {key:'wants_food', title:'Você tem preferência de pacote?', sub:'Isso ajuda a sugerir melhor.', options:['Quero algo mais econômico','Quero com massa','Quero com pizza / pega pizza','Quero completo premium','Quero ver todos']},
 {key:'package', title:'Escolha uma opção de pacote', sub:'Depois mostramos a conta completa.'}
];
function title(s){return typeof s.title==='function'?s.title():s.title}
function setProgress(){document.querySelector('.progress i').style.width=Math.round(((step+1)/screens.length)*100)+'%'}
function btns(back=true){return `<div class="actions">${back?'<button class="btn ghost" onclick="Q.back()">Voltar</button>':''}<button class="btn" onclick="Q.next()">Continuar</button></div>`}
async function loadPackages(){ const y=new Date(state.event_date).getFullYear(); state.year=y; const r=await fetch('/api/packages?year='+y); packages=await r.json(); }
function render(){setProgress(); const s=screens[step]; let html=`<div class="q"><span class="pill">Orçamento online</span><h1>${title(s)}</h1><p>${s.sub||''}</p>`;
 if(s.key==='package') { if(!packages.length){ html+=`<div class="result"><h3>Orçamento indisponível para ${state.year}</h3><p>Esse ano ainda não está ativo. Fale com nossa equipe no WhatsApp.</p></div><a class="btn" href="https://wa.me/5516997913686">Chamar no WhatsApp</a>`; el.innerHTML=html+'</div>'; return; }
 const g=Number(state.guests||0); html+=packages.map(p=>{const add=Math.max(0,g-Number(p.base_people)); const addTotal=add*Number(p.additional_price); const total=Number(p.base_price)+addTotal; return `<div class="package-option" onclick="Q.selectPackage('${p.id}')"><h3>Pacote ${p.name} para ${p.base_people} pessoas - ${fmt(p.base_price)}</h3><p>${add} convidados adicionais: ${fmt(p.additional_price)} x ${add} = ${fmt(addTotal)}</p><strong>Total: ${fmt(total)}</strong><small>${p.duration} • ${p.availability}</small></div>`}).join(''); html+=`<button class="btn ghost" onclick="Q.back()">Voltar</button>`; el.innerHTML=html+'</div>'; return; }
 if(s.options) html+=s.options.map(o=>`<button class="package-option" onclick="Q.pick('${s.key}','${o.replace(/'/g,"\\'")}')">${o}</button>`).join('')+`<button class="btn ghost" onclick="Q.back()">Voltar</button>`;
 else html+=`<input id="field" type="${s.input}" placeholder="${s.placeholder||''}" value="${state[s.key]||''}">${btns(step>0)}`;
 el.innerHTML=html+'</div>'; const f=document.getElementById('field'); if(f) f.focus(); }
window.Q={
 next:async()=>{const s=screens[step]; const f=document.getElementById('field'); if(f&&!f.value.trim()){f.focus();return} if(f) state[s.key]=f.value.trim(); if(s.key==='event_date') await loadPackages(); step=Math.min(step+1,screens.length-1); render();},
 back:()=>{step=Math.max(0,step-1); render()},
 pick:async(k,v)=>{state[k]=v; step++; render()},
 selectPackage:async(id)=>{state.selected_package_id=id; const r=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)}); const data=await r.json(); const p=data.package; el.innerHTML=`<div class="q"><span class="pill">Orçamento pronto</span><h1>${state.name}, seu orçamento ficou assim:</h1><div class="result"><h3>Pacote ${p.name} para ${p.base_people} pessoas - ${fmt(p.base_price)}</h3><p>${data.add} convidados adicionais: ${fmt(p.additional_price)} x ${data.add} = ${fmt(data.addTotal)}</p><h2>Total: ${fmt(data.total)}</h2><p>${p.included}</p><small>${p.rules}</small></div><a class="btn" href="${data.whatsapp_url}">Enviar para o WhatsApp</a><button class="btn ghost" onclick="location.reload()">Novo orçamento</button></div>`; document.querySelector('.progress i').style.width='100%';}
}; render();
})();
