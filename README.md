# Site + Orçamento Online — Buffet Biruta Park

Sistema completo com site institucional, orçamento interativo, promoções, banners, leads e painel administrativo.

## Recursos
- Home editável com banner e destaque de promoção
- Página `/orcamento` com atendimento guiado
- Cálculo automático: pacote base + convidados adicionais = total
- WhatsApp obrigatório antes de liberar orçamento
- Página `/promocoes`
- Admin em `/admin`
- Gestão de anos: 2026, 2027, 2028...
- Ativar/desativar anos e pacotes
- Adicionar, editar e excluir pacotes
- Banners e promoções editáveis no admin
- Leads salvos no banco
- Favicon/logo na aba do navegador
- Rodapé profissional
- Logo flutuando/subindo no fundo da home

## Instalação local
1. Crie o banco PostgreSQL:
```sql
CREATE DATABASE biruta_site;
```
2. Copie `.env.example` para `.env` e ajuste `DATABASE_URL`.
3. Instale:
```bash
npm install
npm run db:setup
npm run seed
npm start
```
4. Acesse:
- Site: http://localhost:3000
- Orçamento: http://localhost:3000/orcamento
- Admin: http://localhost:3000/admin

Login padrão configurado no `.env`:
- `ADMIN_EMAIL=admin@birutapark.com.br`
- `ADMIN_PASSWORD=admin123`

Troque a senha antes de publicar.

## Publicação
Pode ser publicado em VPS, Render, Railway, Fly.io ou outro host Node.js com PostgreSQL.
Configure:
- `DATABASE_URL`
- `SESSION_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `WHATSAPP_NUMBER`
- `SITE_URL`

## Observação
A logo inicial está em SVG editável dentro de `public/assets/logo.svg`. Para usar a logo oficial, substitua esse arquivo e também `public/assets/favicon.svg`.
