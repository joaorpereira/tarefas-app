# Gerenciador de tarefas

Aplicação simples de tarefas feita com Next.js 15 (App Router), React 19, tRPC v11 e Tailwind CSS. Os dados ficam em memória no servidor, sem banco de dados.

## Como rodar

```bash
npm install
npm run dev
```

Abra http://localhost:3000. A página inicial redireciona para `/tarefas`.

## Testes

Os testes end-to-end usam Playwright e sobem o servidor de desenvolvimento sozinhos.

```bash
npx playwright install chromium   # primeira vez
npm run test:e2e
```

## Como funciona

- **Backend**: `src/server/routers/tarefas.ts` define as procedures `list`, `byId`, `create`, `update` e `delete`. A validação de entrada usa Zod, e as falhas viram `TRPCError` com mensagem em português.
- **Armazenamento**: `src/server/store.ts` guarda as tarefas num `Map`, anexado ao `globalThis` para não ser zerado pelo hot reload.
- **HTTP**: a rota `src/app/api/trpc/[trpc]/route.ts` expõe o router. O cliente chama `/api/trpc` (`src/components/Providers.tsx`).
- **SSR**: a página `/tarefas` chama o router diretamente via `createCaller`, sem passar pelo HTTP, e envia a lista pronta para o componente cliente.
- **Feedback**: sucesso e erro de exclusão aparecem como toast. Erros de formulário aparecem junto dos campos ou no topo do formulário.

## Decisões

- Sem bônus de infinite scroll: o escopo foi mantido enxuto para o núcleo ficar bem feito.
- `dataCriacao` é uma string ISO. Assim o JSON atravessa o tRPC sem precisar de superjson.
- A página de listagem é dinâmica (`force-dynamic`), para sempre mostrar o estado atual da memória.

## Limitações

- Os dados somem quando o servidor reinicia.
- Em um deploy com várias instâncias ou serverless, cada uma tem a sua própria memória, então as tarefas não são compartilhadas.
