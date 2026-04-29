# Buffet Biruta Park — versão com PostgreSQL

Esta versão salva os dados no PostgreSQL externo. Assim, ao atualizar o GitHub ou fazer novo deploy no Render, os dados da agenda, usuários, leads, pacotes, banners, promoções e depoimentos continuam no banco.

## Render

1. Crie um banco PostgreSQL no Render.
2. Copie a `DATABASE_URL` do banco.
3. No serviço Web do site, em **Environment**, adicione:
   - `DATABASE_URL`
   - `SESSION_SECRET`
4. Comandos:
   - **Build Command:** `yarn`
   - **Start Command:** `yarn start`

## Acessos iniciais

Admin do site:
- Login: `17717592000160`
- Senha: `Biruta@2026`

Agenda de decoração:
- Link: `/agendadecoracao`
- Login: `decoracao`
- Senha: `Biruta@2026`

## Importante

Os cadastros ficam no PostgreSQL. Em hospedagem gratuita do Render, uploads locais de imagens podem precisar ser reenviados após rebuild/redeploy, mas agenda e registros não serão perdidos.
