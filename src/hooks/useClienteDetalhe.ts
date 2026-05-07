import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DetalheCompleto {
  empresa: { id: string; nome: string; criada_em: string };
  assinatura: any | null;
  plano: any | null;
  kpis_uso: { qtd_oss_total: number; qtd_oss_30d: number; qtd_funcionarios: number; qtd_usuarios: number; ultima_atividade: string | null };
  eventos_billing: Array<{ tipo: string; valor_centavos: number | null; payload: any; criado_em: string }>;
  notas: Array<{ id: string; texto: string; criado_em: string; autor_nome: string }>;
}

export function useClienteDetalhe(empresaId: string) {
  return useQuery({
    queryKey: ["admin-cliente-detalhe", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase.schema("admin" as any).rpc("detalhe_empresa" as any, { p_empresa_id: empresaId });
      if (error) throw error;
      const p = data as any;
      if (!p?.success) throw new Error(p?.error ?? "Falha");
      return p as DetalheCompleto & { success: boolean };
    },
  });
}

export function useCriarNota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ empresaId, texto }: { empresaId: string; texto: string }) => {
      const { data, error } = await supabase.schema("admin" as any).rpc("criar_nota" as any, { p_empresa_id: empresaId, p_texto: texto });
      if (error) throw error;
      const p = data as any;
      if (!p?.success) throw new Error(p?.error ?? "Falha");
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["admin-cliente-detalhe", vars.empresaId] }),
  });
}
