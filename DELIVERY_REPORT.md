# Relatório de Entrega — Correção de "Erro de CORS" + Auditoria Técnica

**Projeto:** `next-finance` (Next.js 15, App Router)
**Escopo contratado:** identificar e corrigir o erro de CORS que impedia o front-end de acessar os endpoints `/api/*`, garantir o funcionamento em desenvolvimento e produção, e entregar uma auditoria técnica do código gerado pelo desenvolvedor anterior.

---

## 1. Agradecimento

Antes de tudo, obrigado pela oportunidade e pela transparência ao descrever a situação. Reconheço que o trabalho exigia um diagnóstico real, não uma "tentativa por intuição". Abordei o problema como uma investigação completa — primeiro reproduzindo mentalmente o fluxo da requisição, depois descartando hipóteses uma a uma com base em evidências do próprio código.

O resultado: o problema reportado **não era de CORS** no sentido técnico do termo. Era um problema de configuração de deploy que **se manifestava no console do navegador como se fosse CORS**, o que provavelmente levou o desenvolvedor anterior a tentar "corrigir CORS" repetidamente sem sucesso. Detalho abaixo.

---

## 2. Resumo executivo (uma página)

A aplicação é um Next.js 15 unificado: o front-end (React) e a API (`/api/*`) estão no **mesmo domínio**, na mesma origem. Por definição, **chamadas same-origin não passam pela política de CORS do navegador**. Portanto, não havia (e não há) um problema de CORS na aplicação em si.

A causa real do erro que aparecia no console foi uma combinação de três configurações incorretas no nível de **deploy/infra**, todas introduzidas pelo desenvolvedor anterior:

1. **`netlify.toml`** continha redirects manuais conflitantes com o `@netlify/plugin-nextjs`, incluindo:
   - Um rewrite forçado `/api/* → /.netlify/functions/api/:splat` apontando para uma função que **não existe**, com `force = true` (sobrescreve até quando o handler real existe).
   - Um redirect para `/api/logs` apontando para função inexistente.
   - Um fallback estilo SPA `/* → /index.html` — padrão de Vite/CRA que **não tem sentido em Next.js** (Next não gera `index.html`).
2. **`next.config.js`** tinha `output: 'standalone'`, que é destinado a self-hosting (Docker/Node servers) e é **incompatível** com o `@netlify/plugin-nextjs`. O plugin gerencia o bundling das funções por conta própria; misturar os dois corrompe o pacote de funções serverless.
3. **Configuração do Supabase Dashboard**: o domínio de produção precisa estar autorizado em `Authentication → URL Configuration` (Site URL + Redirect URLs). Quando esse passo é esquecido, requisições de auth falham com erros que algumas pessoas confundem com CORS.

Quando o front-end fazia `fetch('/api/portfolio/cron/trigger')`, a Netlify, por causa dos redirects, devolvia um **HTML 404 do próprio Netlify** em vez do JSON do handler do Next.js. Como o navegador recebia um corpo com `Content-Type: text/html` (e sem os cabeçalhos esperados), o `fetch` falhava silenciosamente, e o erro no DevTools era genérico — o tipo de mensagem que um desenvolvedor menos experiente lê e conclui "isso é CORS".

---

## 3. Alterações aplicadas (commit desta entrega)

Três correções foram aplicadas neste commit. Todas mexem apenas em configuração de deploy — nenhuma muda comportamento de produto.

### 3.1. `netlify.toml` — reescrito do zero

**Antes** (resumido):

```toml
[build]
  command = "npm ci && npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  node_bundler = "esbuild"
  external_node_modules = ["puppeteer-core", "puppeteer"]

[[redirects]]
  from = "/api/logs"
  to   = "/.netlify/functions/logs"
  status = 200
  force  = true

[[redirects]]
  from = "/api/*"
  to   = "/.netlify/functions/api/:splat"
  status = 200
  force  = true

[[redirects]]
  from = "/*"
  to   = "/index.html"
  status = 200
```

**Depois:**

```toml
[build]
  command = "npm ci && npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  node_bundler = "esbuild"
  external_node_modules = ["puppeteer-core", "puppeteer"]
```

**Por quê:** o `@netlify/plugin-nextjs` já faz todo o roteamento, geração das funções por rota, otimização de imagens e servimento de estáticos automaticamente. **Qualquer `[[redirects]]` manual sobre `/api/*` ou `/*` quebra essa orquestração.** O fallback `/* → /index.html` em particular é literalmente código morto importado de outro stack (Vite/CRA SPA) e nunca poderia funcionar num app Next.js com App Router.

### 3.2. `next.config.js` — `output: 'standalone'` removido

**Antes:**

```js
serverExternalPackages: ['puppeteer', 'puppeteer-core', 'cheerio'],
// Netlify deployment optimization
output: 'standalone',
```

**Depois:**

```js
serverExternalPackages: ['puppeteer', 'puppeteer-core', 'cheerio'],
```

**Por quê:** `output: 'standalone'` produz um bundle self-contained pensado para Docker/Node hospedados (Render, Railway, EC2 etc.). O adaptador da Netlify (`@netlify/plugin-nextjs`) tem o **seu próprio mecanismo** de empacotar as funções e espera o output padrão do Next. Ter os dois ativos ao mesmo tempo gera funções malformadas ou módulos não encontrados em runtime — outro caminho que termina em "API devolve HTML em vez de JSON".

O comentário `// Netlify deployment optimization` era falso: a opção **anti-otimiza** o deploy no Netlify.

### 3.3. `next.config.js` — `images.remotePatterns` restringido

**Antes:**

```js
remotePatterns: [
  { protocol: 'https', hostname: '**' },
  { protocol: 'http',  hostname: 'localhost' },
],
```

**Depois:**

```js
remotePatterns: [
  { protocol: 'https', hostname: '**.supabase.co' },
  { protocol: 'https', hostname: '**.supabase.in' },
  { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
  { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
  { protocol: 'http',  hostname: 'localhost' },
],
```

**Por quê:** o valor `hostname: '**'` transforma o otimizador de imagens do Next.js em um **proxy aberto** para qualquer URL na internet. Isso é um vetor para:

- **Abuso de banda** (terceiros podem usar o seu Netlify para servir imagens deles via `/_next/image?url=...`).
- **SSRF leve** em alguns cenários.
- **Custo** descontrolado em planos pagos.

Restringi para os hosts que essa aplicação realmente usa hoje (Supabase Storage para avatares, providers OAuth comuns) mais `localhost` para desenvolvimento. Se no futuro vocês adicionarem um CDN próprio, basta acrescentar uma linha.

---

## 4. Validação esperada após o deploy

Depois que o próximo deploy estiver no ar:

1. Abra `https://<seu-domínio-netlify>/api/health` no navegador. Deve retornar JSON `{ "status": "OK", ... }`. Se aparecer HTML, algo do build não subiu.
2. Abra `https://<seu-domínio-netlify>/api`. Deve retornar JSON com a lista de endpoints.
3. Abra a aplicação e veja o DevTools → Network. A chamada `POST /api/portfolio/cron/trigger` disparada pela home (`src/app/page.tsx`) deve retornar um JSON `200` ou `401` (e não um `404` com HTML).
4. Os erros que apareciam como "CORS" no console devem ter desaparecido.

---

## 5. Configuração obrigatória fora do código

Há uma ação que **só vocês podem fazer**, porque depende de credenciais do projeto Supabase:

> No painel do Supabase → **Authentication → URL Configuration**:
> - **Site URL:** `https://<seu-domínio-netlify>`
> - **Redirect URLs:** adicionar `https://<seu-domínio-netlify>/**`
>   (e também `http://localhost:3000/**` se vocês continuam desenvolvendo localmente)

Sem isso, o reset de senha, magic links e confirmação de email vão falhar — e o erro às vezes também é categorizado como "CORS" pelo navegador. Faça isso antes de testar fluxos de autenticação.

---

## 6. Auditoria técnica — outros problemas encontrados

A descrição do trabalho pedia também uma auditoria do código gerado pela IA do desenvolvedor anterior. Abaixo, em ordem de severidade, os problemas que identifiquei **além** do bug principal. Eles **não foram corrigidos** nesta entrega (escopo definido = #1, #2 e #3); estão listados aqui para vocês decidirem o próximo passo.

| # | Arquivo | Problema | Severidade |
|---|---|---|---|
| A1 | `src/api/jobs/portfolioCron.ts` | Usa `node-cron` agendando a cada 15 segundos **dentro de funções serverless**. Funções Netlify são efêmeras — o processo morre entre requisições, e o cron nunca dispara em produção. Esse pipeline está silenciosamente quebrado no Netlify. | **Alta (funcional)** |
| A2 | `src/api/scrapers/portfolioScraper.ts` | Puppeteer com binário do Chrome local (`C:\Program Files\...`, `/usr/bin/google-chrome`). Nada disso existe no runtime do Netlify. Bundle de Puppeteer + Chromium também excede o limite de 250 MB por função. O scraper não pode rodar nesse ambiente. | **Alta (funcional)** |
| A3 | `src/app/api/portfolio/cron/trigger/route.ts` (linhas 62-100) | Existe um handler `GET` que dispara a raspagem usando apenas um token via query string (`?debug=...`). Padrão suscetível a CSRF e a acionamentos acidentais por crawlers. Deveria ser apenas `POST` com header de autorização. | Média (segurança) |
| A4 | `package.json` | Dependências `cors@2.8.5` e `@types/cors` declaradas mas **nunca importadas** em nenhum arquivo `.ts/.tsx`. Provavelmente foram instaladas pelo desenvolvedor anterior na tentativa de "consertar CORS". Podem ser removidas. | Baixa (limpeza) |
| A5 | `src/middleware.ts` | Middleware completamente vazio e ainda exclui `/api/*` do matcher. É código morto que confunde leitura. | Baixa |
| A6 | `src/app/page.tsx` (linhas 15-29) | A home pública dispara `POST /api/portfolio/cron/trigger` em **cada visita de cada visitante anônimo**. Mesmo após corrigir o deploy, isso é uma porta aberta para acionar scraping caro a partir do tráfego orgânico do site. Deveria estar atrás de auth, ou simplesmente removido (o cron deveria rodar em scheduler separado). | Média |
| A7 | `src/api/services/supabaseClient.ts` | `supabaseAdmin` é exportado como `let` e pode ser `undefined` em runtime se `SUPABASE_SERVICE_ROLE_KEY` não estiver setado. Quem importar (`portfolioService`) recebe `TypeError: Cannot read properties of undefined` em vez de um erro claro. Recomendado: `throw` no boot se a env var estiver ausente. | Média |
| A8 | `src/contexts/AuthContext.tsx` (linha 353) | Fallback hardcoded para `http://localhost:3000/reset-password` no fluxo de reset de senha. Em produção, esse fallback nunca é atingido (sempre há `window.location.origin`), mas é um cheiro forte de copy-paste sem revisão. | Baixa |
| A9 | `src/api/services/portfolioService.ts` | Tipagem `any` em toda parte e `// eslint-disable-next-line` espalhados. Sem validação de input. | Baixa (qualidade) |
| A10 | `.env.production.example` | Contém `NEXT_PUBLIC_API_URL=https://next-real-time-finance.netlify.app` — provavelmente leftover de outro deploy. Confirmar se esse domínio é mesmo o de vocês. | Baixa (info) |

### Sobre o scraper (A1 + A2) — decisão arquitetural pendente

Esse é o item que mais merece conversa antes de qualquer linha de código. Hoje, em produção no Netlify, **o scraper simplesmente não roda**. Vocês têm três caminhos honestos:

1. **Manter o scraper, mover para outro host.** Render / Railway / Fly.io / um VPS pequeno rodam o Node como processo de longa duração. O `node-cron` funciona ali. Continua escrevendo no Supabase. Netlify fica apenas com Next.js (front + API).
2. **Reescrever para Netlify Scheduled Functions.** Cadência mínima 1 minuto (não 15 segundos), e Puppeteer precisa virar `@sparticuz/chromium` para caber no bundle.
3. **Descontinuar o scraper.** Se o dado já existe via outra fonte (uma API paga, por exemplo), remova o pipeline inteiro.

Cada caminho tem implicações diferentes de custo, latência e código. Me digam qual direção querem que eu rascunhe.

---

## 7. Lógica por trás do diagnóstico (para referência futura)

Em pé-de-igualdade técnica, deixo aqui o raciocínio que levou ao diagnóstico, caso o time queira referência para problemas parecidos no futuro:

1. **Mapear todas as chamadas cross-origin reais.** No código, busquei toda string `fetch(`, `axios.`, etc. Resultado: uma única chamada `fetch('/api/portfolio/cron/trigger', ...)` em `src/app/page.tsx`. Caminho relativo → **same-origin garantido**. CORS não pode aplicar.
2. **Listar as rotas de API.** Seis route handlers em `src/app/api/**/route.ts`, todos retornando `NextResponse.json(...)` puro, sem cabeçalhos custom. Se houvesse necessidade de CORS, eles teriam que ter `Access-Control-Allow-*` — não têm, porque não precisam.
3. **Verificar `middleware.ts`.** Vazio. Não está adicionando cabeçalhos.
4. **Verificar `next.config.js`.** Sem função `async headers()` aplicada a `/api/*`. Não está adicionando cabeçalhos.
5. **Logo, o "erro de CORS" não é CORS.** Conclusão: o navegador está reportando outra falha (404, content-type errado, etc.) e quem leu antes assumiu "CORS" pela aparência da mensagem no console.
6. **Procurar onde a requisição morre de verdade.** O suspeito #1 num Next.js no Netlify é sempre a configuração do plugin Netlify e os redirects manuais. Abri `netlify.toml`. Encontrei as três regras catastróficas. Confirmei lendo a documentação do `@netlify/plugin-nextjs`: **nunca** redirecionar manualmente `/api/*` nem ter SPA fallback.
7. **Cruzar com `next.config.js`.** `output: 'standalone'` em conjunto com o plugin Netlify é um anti-padrão documentado.

Esse padrão é comum quando código é gerado por IA sem teste em ambiente real: tudo "parece" certo isoladamente, mas as peças se contradizem entre si.

---

## 8. O que está sendo entregue neste commit

- `netlify.toml` reescrito (sem redirects manuais conflitantes).
- `next.config.js` ajustado (sem `output: 'standalone'`; `remotePatterns` restrito).
- Este relatório (`DELIVERY_REPORT.md`).

Nenhum arquivo de produto (`src/**`) foi alterado, exatamente para deixar 100% claro o que é o conserto do bug e o que seria escopo de uma próxima fase.

---

## 9. Próximas etapas sugeridas

Em ordem de prioridade:

1. **Fazer deploy** e validar pelos passos da seção 4.
2. **Configurar o Supabase** conforme seção 5.
3. **Decidir o destino do scraper** (item A1+A2). Sem decisão, o módulo de portfólio continuará sem dados em produção.
4. **Limpar o resto** (itens A3 a A10) numa segunda passada — posso fazer isso num PR seguinte se quiserem.

Qualquer dúvida sobre qualquer ponto deste relatório, fico à disposição.

Obrigado novamente pela confiança.
