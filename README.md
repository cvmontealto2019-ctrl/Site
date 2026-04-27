# Buffet Biruta Park - Site + Orçamento Online

## Como publicar no Render

1. Envie estes arquivos para o Render como Web Service.
2. Build Command: `yarn`
3. Start Command: `yarn start`
4. Não precisa configurar banco de dados para esta versão iniciar. Ela salva os dados em `data/store.json`.

## Login do admin

Acesse `/admin`

E-mail: `admin@birutapark.com.br`
Senha: `admin123`

## Páginas

- `/` site principal
- `/orcamento` orçamento online
- `/promocoes` promoções
- `/admin` painel administrativo

## Correção aplicada

Esta versão não depende mais do PostgreSQL, evitando o erro `ECONNREFUSED 127.0.0.1:5432` no Render.
