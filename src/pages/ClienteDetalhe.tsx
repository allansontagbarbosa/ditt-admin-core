import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, UserCog, CreditCard, Send } from "lucide-react";
import { useClienteDetalhe, useCriarNota } from "@/hooks/useClienteDetalhe";
import { toast } from "sonner";
import { fmtBRL, planoCor, statusCor } from "@/lib/clientes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "geral", label: "Visão geral" },
  { id: "assinatura", label: "Assinatura" },
  { id: "notas", label: "Notas" },
  { id: "atividade", label: "Atividade" },
];

export default function ClienteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState("geral");
  const { data, isLoading } = useClienteDetalhe(id!);

  if (isLoading || !data)
    return <div className="text-muted-foreground">Carregando...</div>;

  const initials = data.empresa.nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/clientes")}
            className="rounded p-1 hover:bg-muted"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {data.empresa.nome}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {data.plano && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-medium",
                    planoCor(data.plano.tier),
                  )}
                >
                  {data.plano.nome}
                </span>
              )}
              {data.assinatura && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-medium",
                    statusCor(data.assinatura.status),
                  )}
                >
                  {data.assinatura.status}
                </span>
              )}
              <span>
                cliente desde{" "}
                {new Date(data.empresa.criada_em).toLocaleDateString("pt-BR", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <UserCog /> Entrar como
        </Button>
      </div>

      <div className="flex gap-4 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "border-b-2 px-3 py-2 text-xs transition-colors",
              tab === t.id
                ? "border-primary font-medium text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "geral" && <TabGeral data={data} />}
        {tab === "assinatura" && <TabAssinatura data={data} />}
        {tab === "notas" && <TabNotas data={data} empresaId={id!} />}
        {tab === "atividade" && <TabAtividade data={data} />}
      </div>
    </div>
  );
}

function TabGeral({ data }: any) {
  const k = data.kpis_uso;
  const items = [
    { l: "OSs total", v: k.qtd_oss_total },
    { l: "OSs (30d)", v: k.qtd_oss_30d },
    { l: "Funcionários", v: k.qtd_funcionarios },
    { l: "Usuários app", v: k.qtd_usuarios },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((it, i) => (
          <div key={i} className="rounded-xl border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {it.l}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{it.v}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-card p-5 text-sm">
        <span className="text-muted-foreground">Última atividade: </span>
        <span className="font-medium">
          {k.ultima_atividade
            ? new Date(k.ultima_atividade).toLocaleString("pt-BR")
            : "Sem registro"}
        </span>
      </div>
    </div>
  );
}

function TabAssinatura({ data }: any) {
  const a = data.assinatura;
  const p = data.plano;
  if (!a)
    return (
      <p className="text-sm text-muted-foreground">Sem assinatura registrada.</p>
    );
  const dt = (s: string | null) =>
    s ? new Date(s).toLocaleDateString("pt-BR") : "—";
  const linhas: Array<[string, string]> = [
    ["Plano", p?.nome ?? "—"],
    ["Status", a.status],
    ["MRR", fmtBRL(a.mrr_centavos)],
    ["Trial", `${dt(a.trial_iniciado_em)} → ${dt(a.trial_termina_em)}`],
    ["Ativada em", dt(a.ativada_em)],
    ["Próximo ciclo", dt(a.proximo_ciclo_em)],
    ["Cancelada em", dt(a.cancelada_em)],
    ...(a.motivo_cancelamento
      ? ([["Motivo", a.motivo_cancelamento]] as Array<[string, string]>)
      : []),
    ["Stripe customer", a.stripe_customer_id ?? "—"],
    ["Stripe sub", a.stripe_subscription_id ?? "—"],
  ];
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {linhas.map(([l, v], i) => (
        <div
          key={i}
          className={cn(
            "flex items-center justify-between gap-4 px-5 py-3 text-sm",
            i > 0 && "border-t",
          )}
        >
          <span className="text-muted-foreground">{l}</span>
          <span className="font-medium">{v}</span>
        </div>
      ))}
    </div>
  );
}

function TabNotas({ data, empresaId }: any) {
  const [texto, setTexto] = useState("");
  const criar = useCriarNota();
  const enviar = async () => {
    if (!texto.trim()) return;
    try {
      await criar.mutateAsync({ empresaId, texto });
      setTexto("");
      toast.success("Nota adicionada");
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-2 rounded-lg border bg-card p-3">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Adicionar nota..."
          rows={2}
          className="flex-1 resize-none bg-transparent text-sm outline-none"
        />
        <button
          onClick={enviar}
          disabled={criar.isPending || !texto.trim()}
          className="flex items-center gap-1 self-end rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          <Send className="h-3 w-3" /> Enviar
        </button>
      </div>
      {data.notas.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          Sem notas ainda.
        </p>
      ) : (
        data.notas.map((n: any) => (
          <div key={n.id} className="rounded-lg border bg-card p-3 text-sm">
            <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
              <span className="font-medium">{n.autor_nome}</span>
              <span>{new Date(n.criado_em).toLocaleString("pt-BR")}</span>
            </div>
            <p className="whitespace-pre-wrap">{n.texto}</p>
          </div>
        ))
      )}
    </div>
  );
}

function TabAtividade({ data }: any) {
  if (data.eventos_billing.length === 0)
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        Sem eventos de billing.
      </p>
    );
  return (
    <div className="space-y-2">
      {data.eventos_billing.map((e: any, i: number) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border bg-card p-3 text-sm"
        >
          <CreditCard className="h-4 w-4 shrink-0 text-primary" />
          <div className="flex-1">
            <div className="flex justify-between">
              <span className="font-medium">{e.tipo}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(e.criado_em).toLocaleString("pt-BR")}
              </span>
            </div>
            {e.valor_centavos != null && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {fmtBRL(e.valor_centavos)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
