import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface KpisDashboard {
  mrr_centavos: number; mrr_anterior_centavos: number; arr_centavos: number;
  clientes_pagantes: number; novos_30d: number; churn_30d: number; churn_taxa_pct: number;
  em_trial: number; trial_vence_semana: number; ticket_medio_centavos: number;
}

export interface EventoAtividade {
  tipo: string; empresa_id: string; empresa_nome: string;
  valor_centavos: number | null; payload: any; criado_em: string;
}

export function useKpisDashboard() {
  return useQuery({
    queryKey: ["admin-kpis"],
    queryFn: async () => {
      const { data, error } = await supabase.schema("admin" as any).rpc("kpis_dashboard" as any);
      if (error) throw error;
      const p = data as any;
      if (!p?.success) throw new Error(p?.error ?? "Falha");
      return p as KpisDashboard & { success: boolean };
    },
    staleTime: 60_000,
  });
}

export function useAtividadeRecente(limit = 20) {
  return useQuery({
    queryKey: ["admin-atividade", limit],
    queryFn: async () => {
      const { data, error } = await supabase.schema("admin" as any).rpc("atividade_recente" as any, { p_limit: limit });
      if (error) throw error;
      const p = data as any;
      if (!p?.success) throw new Error(p?.error ?? "Falha");
      return (p.eventos ?? []) as EventoAtividade[];
    },
    staleTime: 60_000,
  });
}
