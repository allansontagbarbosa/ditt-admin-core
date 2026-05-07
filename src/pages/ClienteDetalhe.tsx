import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, UserCog } from "lucide-react";
import { useClienteDetalhe } from "@/hooks/useClienteDetalhe";
import { planoCor, statusCor } from "@/lib/clientes";
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

// Stubs — substituídos no PROMPT 12
function TabGeral({ data: _data }: any) {
  return <p className="text-sm text-muted-foreground">Substituído pelo PROMPT 12.</p>;
}
function TabAssinatura({ data: _data }: any) {
  return <p className="text-sm text-muted-foreground">Substituído pelo PROMPT 12.</p>;
}
function TabNotas({ data: _data, empresaId: _empresaId }: any) {
  return <p className="text-sm text-muted-foreground">Substituído pelo PROMPT 12.</p>;
}
function TabAtividade({ data: _data }: any) {
  return <p className="text-sm text-muted-foreground">Substituído pelo PROMPT 12.</p>;
}
