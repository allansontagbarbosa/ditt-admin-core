// Cliente para a Edge Function `admin-proxy` no backend principal.
// Bypassa Supabase Auth — usa apenas shared secret + service_role no server.

const PROXY_URL = import.meta.env.VITE_ADMIN_PROXY_URL as string | undefined;
const PANEL_SECRET = import.meta.env.VITE_ADMIN_PANEL_SECRET as string | undefined;
const PLACEHOLDER_SECRET = "TROQUE_ESTE_VALOR_PELO_MESMO_ADMIN_PANEL_SECRET_DO_BACKEND";

type AdminProxyErrorCode = "missing_config" | "unauthorized" | "request_failed";

export class AdminProxyError extends Error {
  status?: number;
  code: AdminProxyErrorCode;

  constructor(message: string, code: AdminProxyErrorCode, status?: number) {
    super(message);
    this.name = "AdminProxyError";
    this.code = code;
    this.status = status;
  }
}

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
  if (!PROXY_URL || !PANEL_SECRET || PANEL_SECRET === PLACEHOLDER_SECRET) {
    throw new AdminProxyError(
      "admin-proxy não configurado (defina VITE_ADMIN_PROXY_URL e VITE_ADMIN_PANEL_SECRET em .env)",
      "missing_config",
    );
  }

  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Envia os dois nomes para compatibilidade com versões antigas da function.
      "x-admin-panel-secret": PANEL_SECRET,
      "x-admin-secret": PANEL_SECRET,
    },
    body: JSON.stringify({ action, params }),
  });

  const text = await res.text();
  const json = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return { error: text };
        }
      })()
    : {};
  if (!res.ok || json?.error) {
    if (res.status === 401) {
      throw new AdminProxyError(
        "Acesso negado pelo admin-proxy (401). O VITE_ADMIN_PANEL_SECRET deste painel não confere com o ADMIN_PANEL_SECRET configurado no backend principal.",
        "unauthorized",
        res.status,
      );
    }

    throw new AdminProxyError(
      json?.error ?? `admin-proxy ${res.status}`,
      "request_failed",
      res.status,
    );
  }
  return json.data as T;
}