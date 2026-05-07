import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmpresaCliente {
  empresa_id: string; nome: string; criada_em: string;
  assinatura_id: string | null; plano_tier: "starter" | "pro" | "enterprise" | null;
  plano_nome: string | null;
  status: "trial" | "ativa" | "inadimplente" | "cancelada" | "pausada" | null;
  mrr_centavos: number | null;
  trial_termina_em: string | null;
  ativada_em: string | null;
  cancelada_em: string | null;
  email_principal: string | null;
}

export function useClientes(status?: string, busca?: string) {
  return useQuery({
    queryKey: ["admin-clientes", status, busca],
    queryFn: async () => {
      const { data, error } = await supabase.schema("admin" as any).rpc("listar_empresas" as any, {
        p_status: status ?? null, p_busca: busca || null,
      });
      if (error) throw error;
      const p = data as any;
      if (!p?.success) throw new Error(p?.error ?? "Falha");
      return (p.empresas ?? []) as EmpresaCliente[];
    },
    staleTime: 30_000,
  });
}
