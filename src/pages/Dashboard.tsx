import { useKpisDashboard, useAtividadeRecente } from "@/hooks/useDashboard";
import { TrendingUp, TrendingDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const fmtBRL = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Dashboard() {
  const { data: kpis, isLoading } = useKpisDashboard();
  useAtividadeRecente(8);

  if (isLoading || !kpis)
    return (
      <div className="text-muted-foreground">Carregando...</div>
    );

  const deltaMrr = kpis.mrr_centavos - kpis.mrr_anterior_centavos;
  const deltaPct =
    kpis.mrr_anterior_centavos > 0
      ? (deltaMrr / kpis.mrr_anterior_centavos) * 100
      : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Visão geral do negócio
        </h1>
        <p className="text-sm text-muted-foreground">
          Atualizado em tempo real
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Kpi
          label="MRR"
          valor={fmtBRL(kpis.mrr_centavos)}
          delta={
            deltaMrr >= 0
              ? `+${fmtBRL(deltaMrr)} vs mês passado`
              : `${fmtBRL(deltaMrr)} vs mês passado`
          }
          deltaUp={deltaMrr >= 0}
        />
        <Kpi
          label="ARR"
          valor={fmtBRL(kpis.arr_centavos)}
          delta={`${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}% MoM`}
          deltaUp={deltaPct >= 0}
        />
        <Kpi
          label="Clientes pagantes"
          valor={kpis.clientes_pagantes.toLocaleString("pt-BR")}
          delta={`+${kpis.novos_30d} novos / -${kpis.churn_30d} churn (30d)`}
          deltaUp={kpis.novos_30d >= kpis.churn_30d}
          icon="plus"
        />
        <Kpi
          label="Em trial"
          valor={kpis.em_trial.toLocaleString("pt-BR")}
          delta={
            kpis.trial_vence_semana > 0
              ? `${kpis.trial_vence_semana} vencem essa semana`
              : "—"
          }
          neutral
        />
        <Kpi
          label="Churn (30d)"
          valor={`${kpis.churn_taxa_pct.toFixed(1)}%`}
          delta={`${kpis.churn_30d} cancelamentos`}
          deltaUp={false}
        />
        <Kpi
          label="Ticket médio"
          valor={fmtBRL(kpis.ticket_medio_centavos)}
          delta="por cliente pagante"
          neutral
        />
      </div>

      {/* Atividade recente vai no PROMPT 8 */}
    </div>
  );
}

function Kpi({
  label,
  valor,
  delta,
  deltaUp,
  neutral,
  icon,
}: {
  label: string;
  valor: string;
  delta?: string;
  deltaUp?: boolean;
  neutral?: boolean;
  icon?: "plus";
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{valor}</p>
      {delta && (
        <div
          className={cn(
            "mt-2 flex items-center gap-1 text-xs",
            neutral
              ? "text-muted-foreground"
              : deltaUp
                ? "text-primary"
                : "text-destructive",
          )}
        >
          {!neutral &&
            (deltaUp ? (
              icon === "plus" ? (
                <Plus className="h-3.5 w-3.5" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5" />
              )
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            ))}
          <span>{delta}</span>
        </div>
      )}
    </div>
  );
}
