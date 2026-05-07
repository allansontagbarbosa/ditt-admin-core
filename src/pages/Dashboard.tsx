import { useKpisDashboard, useAtividadeRecente, useMrrSerie } from "@/hooks/useDashboard";
import { TrendingUp, TrendingDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RTooltip,
  Cell,
} from "recharts";

const fmtBRL = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtTempo = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `há ${h}h` : `há ${Math.floor(h / 24)}d`;
};

const TIPO: Record<string, { texto: string; cor: string }> = {
  trial_iniciado: { texto: "entrou em trial", cor: "bg-muted-foreground" },
  assinatura_criada: { texto: "ativou assinatura", cor: "bg-primary" },
  fatura_paga: { texto: "pagou fatura", cor: "bg-primary" },
  fatura_falhou: { texto: "fatura falhou", cor: "bg-amber-500" },
  plano_alterado: { texto: "mudou de plano", cor: "bg-blue-500" },
  cancelada: { texto: "cancelou", cor: "bg-red-500" },
  trial_terminou: { texto: "trial terminou", cor: "bg-amber-500" },
};

export default function Dashboard() {
  const { data: kpis, isLoading } = useKpisDashboard();
  const { data: eventos = [] } = useAtividadeRecente(8);
  const { data: serie = [] } = useMrrSerie();

  if (isLoading || !kpis)
    return <div className="text-muted-foreground">Carregando...</div>;

  const deltaMrr = kpis.mrr_centavos - kpis.mrr_anterior_centavos;
  const deltaPct =
    kpis.mrr_anterior_centavos > 0
      ? (deltaMrr / kpis.mrr_anterior_centavos) * 100
      : 0;
  const taxaConv =
    kpis.em_trial + kpis.novos_30d > 0
      ? ((kpis.novos_30d / (kpis.em_trial + kpis.novos_30d)) * 100).toFixed(0)
      : 0;
  const funilMax = Math.max(kpis.em_trial, kpis.novos_30d, 1);

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

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">MRR — últimos 12 meses</h2>
          {serie.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Sem histórico ainda.
            </p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serie}>
                  <XAxis
                    dataKey="mes_label"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `R$${(Number(v) / 100 / 1000).toFixed(0)}k`}
                  />
                  <RTooltip
                    formatter={(v) => [
                      (Number(v) / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }),
                      "MRR",
                    ]}
                    labelStyle={{ fontSize: 11 }}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Bar dataKey="mrr_centavos" radius={[4, 4, 0, 0]}>
                    {serie.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          i === serie.length - 1
                            ? "hsl(var(--primary))"
                            : "hsl(var(--primary) / 0.3)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Conversão</h2>
          <div className="mt-4 space-y-3">
            <FunilRow label="Em trial" valor={kpis.em_trial} max={funilMax} />
            <FunilRow
              label="Convertidos (30d)"
              valor={kpis.novos_30d}
              max={funilMax}
              destaque
            />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Taxa trial → cliente:{" "}
            <span className="font-semibold text-foreground">{taxaConv}%</span>
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Atividade recente</h2>
        <div className="mt-4">
          {eventos.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum evento ainda.
            </p>
          )}
          {eventos.map((e, i) => {
            const meta =
              TIPO[e.tipo] ?? { texto: e.tipo, cor: "bg-muted-foreground" };
            return (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3 py-3 text-sm",
                  i > 0 && "border-t",
                )}
              >
                <span
                  className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", meta.cor)}
                />
                <div className="min-w-0 flex-1">
                  <p>
                    <span className="font-medium">
                      {e.empresa_nome ?? "?"}
                    </span>{" "}
                    <span className="text-muted-foreground">{meta.texto}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {fmtTempo(e.criado_em)}
                    {e.valor_centavos ? ` · ${fmtBRL(e.valor_centavos)}` : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
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

function FunilRow({
  label,
  valor,
  max,
  destaque,
}: {
  label: string;
  valor: number;
  max: number;
  destaque?: boolean;
}) {
  const w = (valor / max) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{valor}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            destaque ? "bg-primary" : "bg-primary/40",
          )}
          style={{ width: `${w}%` }}
        />
      </div>
    </div>
  );
}
