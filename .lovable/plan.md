## Objetivo
Manter o login master local no painel e ainda assim conseguir chamar as RPCs `admin.*` do backend principal, criando uma **Edge Function proxy** no backend principal que usa `service_role` e valida um shared secret.

## Arquitetura

```text
ditt-admin (frontend)                Backend principal
──────────────────────                ─────────────────
 login master local (.env) ─────┐
                                │
 fetch('/functions/v1/          │      Edge Function: admin-proxy
   admin-proxy',                ├────▶ - valida header x-admin-secret
   { action, params,            │      - usa SUPABASE_SERVICE_ROLE_KEY
     x-admin-secret })          │      - chama admin.<rpc>(...)
                                │      - retorna JSON
```

Nenhuma sessão Supabase Auth é usada. O painel só precisa do shared secret.

## Passos

### 1. Edge Function (deploy manual no backend principal `cgsdnvuigolxwzfmnykk`)

Você vai criar no projeto principal, com `Verify JWT: OFF`, a função `admin-proxy` que:

- aceita POST `{ action: string, params: object }`
- valida header `x-admin-secret` contra a env `ADMIN_PANEL_SECRET`
- executa `supabase.schema('admin').rpc(action, params)` com service_role
- whitelist de actions: `kpis_dashboard`, `mrr_serie_12m`, `atividade_recente`, `listar_empresas`, `detalhe_cliente`, `criar_nota_cliente`
- devolve `{ data, error }`

Eu te entrego o `index.ts` pronto pra colar. Você:
- cria a função no dashboard do projeto principal
- adiciona secrets `ADMIN_PANEL_SECRET` (valor forte, aleatório) e confirma que `SUPABASE_SERVICE_ROLE_KEY` já existe
- deploya

### 2. Configuração no ditt-admin

- Adicionar em `.env`: `VITE_ADMIN_PROXY_URL` e `VITE_ADMIN_PANEL_SECRET` (mesmo valor do backend principal)
- ⚠️ o secret vai pro bundle JS público — mesma decisão que você já tomou pra `VITE_MASTER_PASSWORD`

### 3. Client wrapper `src/lib/adminProxy.ts`

Função única `callAdmin(action, params)` que faz `fetch` na edge function com o header do secret e retorna `{ data, error }`.

### 4. Refazer os hooks

Substituir chamadas `supabase.schema('admin').rpc(...)` por `callAdmin(...)` em:
- `src/hooks/useDashboard.ts` (kpis_dashboard, mrr_serie_12m, atividade_recente)
- `src/hooks/useClientes.ts` (listar_empresas)
- `src/hooks/useClienteDetalhe.ts` (detalhe_cliente, criar_nota_cliente)

### 5. Limpeza de tokens antigos

No `useStaffAuth` (master local) já não usamos Supabase Auth, mas o cliente supabase-js ainda anexa o Bearer JWT antigo do localStorage causando os 401 "unrecognized kid". Vou:
- remover `persistSession/storageKey` do client supabase-js (não usamos mais Auth) OU limpar `localStorage['ditt-admin-auth']` no boot
- as chamadas ao proxy ignoram o Supabase JS, então esse ruído some naturalmente

## Ordem de execução

1. Eu escrevo `admin-proxy/index.ts` e te passo pra colar no projeto principal + instruções de secrets
2. Você deploya e me confirma a URL
3. Eu atualizo `.env`, adiciono `adminProxy.ts`, e reescrevo os 3 hooks
4. Validamos `/clientes` mostrando empresas

## Riscos

- `VITE_ADMIN_PANEL_SECRET` é público no bundle: qualquer pessoa que baixe o JS do painel consegue chamar a edge function direto. Se o painel ficar exposto na internet aberta isso é equivalente a dar acesso admin ao backend. Aceitável só se o painel ficar atrás de acesso restrito (IP, DNS interno, etc). Se não for o caso, a decisão certa é **A** (Supabase Auth real).
