// Edge Function: admin-proxy
// Deploy este arquivo NO BACKEND PRINCIPAL (projeto Supabase cgsdnvuigolxwzfmnykk),
// NÃO no backend Cloud deste painel. Configure como:
//   - Nome: admin-proxy
//   - Verify JWT: OFF
//   - Secrets necessários no projeto principal:
//       ADMIN_PANEL_SECRET       (string aleatória forte; mesmo valor colocado no .env do ditt-admin)
//       SUPABASE_URL             (já existe)
//       SUPABASE_SERVICE_ROLE_KEY (já existe)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-panel-secret, x-admin-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Whitelist explícita — qualquer coisa fora daqui é rejeitada.
const ALLOWED_ACTIONS = new Set([
  "kpis_dashboard",
  "mrr_serie_12m",
  "atividade_recente",
  "listar_empresas",
  "detalhe_empresa",
  "criar_nota",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const expected = Deno.env.get("ADMIN_PANEL_SECRET");
    const provided = req.headers.get("x-admin-panel-secret") ?? req.headers.get("x-admin-secret");
    if (!expected || !provided || provided !== expected) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");
    const params = body?.params ?? {};

    if (!ALLOWED_ACTIONS.has(action)) {
      return json({ error: "action not allowed" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data, error } = await supabase
      .schema("admin" as any)
      .rpc(action as any, params);

    if (error) return json({ error: error.message }, 400);
    return json({ data }, 200);
  } catch (e) {
    return json({ error: (e as Error).message ?? "internal error" }, 500);
  }
});

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}