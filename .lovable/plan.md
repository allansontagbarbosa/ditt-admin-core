## Contexto

A edge function `admin-proxy` (no backend principal `cgsdnvuigolxwzfmnykk`) já valida o `x-admin-panel-secret` corretamente. O problema é diferente: as RPCs no schema `admin` fazem internamente algo como:

```sql
if not public.is_staff(auth.uid()) then raise exception 'Acesso negado';
```

Mesmo chamando com `service_role`, o `auth.uid()` é `NULL` dentro da função → check falha → `Acesso negado`. `service_role` bypassa RLS, mas não bypassa checks explícitos dentro de `SECURITY DEFINER`.

O `admin-proxy` sozinho **não resolve** — a mudança precisa acontecer no SQL do backend principal.

## Opções (escolha uma)

### Opção A — Adicionar bypass "service role" nas RPCs (recomendado)

No backend principal, alterar a função `public.is_staff(uuid)` (ou o check dentro de cada RPC) para também aceitar quando o chamador é `service_role`:

```sql
create or replace function public.is_staff(_uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    -- bypass: chamadas vindas do service_role (edge functions com shared secret)
    current_setting('request.jwt.claim.role', true) = 'service_role'
    or exists (
      select 1 from admin.usuarios_internos
      where user_id = _uid and ativo = true
    );
$$;
```

Vantagem: uma única alteração destrava todas as 6 RPCs. Nada muda no `admin-proxy` deste projeto.

### Opção B — Criar wrappers `admin.*_proxy` sem check de staff

No backend principal, criar 6 novas funções (`kpis_dashboard_proxy`, `listar_empresas_proxy`, ...) idênticas às originais, porém **sem** o `if not is_staff(...)`. Elas ficam ocultas atrás do secret do `admin-proxy`.

Depois, atualizar o `admin-proxy` para chamar as versões `_proxy`. Mais isolado, mas seis funções duplicadas para manter.

### Opção C — Assinar JWT de staff dentro do admin-proxy

O `admin-proxy` lê `SUPABASE_JWT_SECRET` do env, gera um JWT com `sub = <uuid do owner>` e `role = authenticated`, e usa esse token no header `Authorization` da chamada RPC. `auth.uid()` passa a valer o uuid do owner e `is_staff` retorna true.

Requer adicionar dependência `jose` na edge e configurar `STAFF_USER_ID` como secret. Mais código, mas não altera SQL.

## Recomendação

Ir de **Opção A**: mudança mínima, mantém as RPCs originais, o `admin-proxy` continua exatamente como está.

## Passos concretos

1. No projeto do app principal, rodar o SQL da Opção A alterando `public.is_staff`.
2. Testar aqui novamente — as chamadas via `admin-proxy` devem devolver dados reais.
3. Se preferir B ou C, me diga qual e eu preparo o código pronto pra colar.

## Ajuste extra já feito no painel

O `src/lib/adminProxy.ts` agora envia `{ fn, action, params }` — compatível com a versão atualmente deployada no backend principal (que espera `fn`). Isso já foi corrigido; nada mais a fazer no frontend.
