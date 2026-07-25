import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { callAdmin } from "@/lib/adminProxy";

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
      const p: any = await callAdmin("detalhe_empresa", { p_empresa_id: empresaId });
      if (!p?.success) throw new Error(p?.error ?? "Falha");
      return p as DetalheCompleto & { success: boolean };
    },
    retry: false,
  });
}

export function useCriarNota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ empresaId, texto }: { empresaId: string; texto: string }) => {
      const p: any = await callAdmin("criar_nota", { p_empresa_id: empresaId, p_texto: texto });
      if (!p?.success) throw new Error(p?.error ?? "Falha");
    },
    retry: false,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["admin-cliente-detalhe", vars.empresaId] }),
  });
}
