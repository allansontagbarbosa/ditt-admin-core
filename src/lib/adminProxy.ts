// Cliente para a Edge Function `admin-proxy` no backend principal.
// Bypassa Supabase Auth — usa apenas shared secret + service_role no server.

const PROXY_URL = import.meta.env.VITE_ADMIN_PROXY_URL as string | undefined;
const PANEL_SECRET = import.meta.env.VITE_ADMIN_PANEL_SECRET as string | undefined;

export type AdminAction =
  | "kpis_dashboard"
  | "mrr_serie_12m"
  | "atividade_recente"
  | "listar_empresas"
  | "detalhe_empresa"
  | "criar_nota";

export async function callAdmin<T = any>(
  action: AdminAction,
  params: Record<string, unknown> = {},
): Promise<T> {
  if (!PROXY_URL || !PANEL_SECRET) {
    throw new Error(
      "admin-proxy não configurado (defina VITE_ADMIN_PROXY_URL e VITE_ADMIN_PANEL_SECRET em .env)",
    );
  }

  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": PANEL_SECRET,
    },
    body: JSON.stringify({ action, params }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.error) {
    throw new Error(json?.error ?? `admin-proxy ${res.status}`);
  }
  return json.data as T;
}