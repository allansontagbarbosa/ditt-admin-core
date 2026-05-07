import { useState } from "react";
import { Link } from "react-router-dom";
import { useClientes, EmpresaCliente } from "@/hooks/useClientes";
import { Plus, Download, Eye, UserCog, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fmtBRL, fmtMes, planoCor, statusCor } from "@/lib/clientes";

const FILTROS = [
  { id: "todas", label: "Todas" },
  { id: "trial", label: "Trial" },
  { id: "ativa", label: "Ativas" },
  { id: "inadimplente", label: "Inadimplentes" },
  { id: "cancelada", label: "Canceladas" },
];

export default function Clientes() {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const { data: clientes = [], isLoading } = useClientes(
    filtro === "todas" ? undefined : filtro,
    busca,
  );

  const stats = {
    total: clientes.length,
    pagantes: clientes.filter((c) => c.status === "ativa").length,
    trial: clientes.filter((c) => c.status === "trial").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {stats.total} empresas · {stats.pagantes} pagantes · {stats.trial} em trial
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download /> Exportar
          </Button>
          <Button size="sm">
            <Plus /> Nova empresa
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome..."
          className="h-9 w-64"
        />
        {FILTROS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              filtro === f.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Empresa</th>
              <th className="px-4 py-3 text-left font-medium">Plano</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">MRR</th>
              <th className="px-4 py-3 text-left font-medium">Cliente desde</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && clientes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Nenhuma empresa encontrada.
                </td>
              </tr>
            )}
            {clientes.map((c) => (
              <LinhaCliente key={c.empresa_id} c={c} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LinhaCliente({ c }: { c: EmpresaCliente }) {
  const initials = c.nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const trialDias = c.trial_termina_em
    ? Math.ceil((new Date(c.trial_termina_em).getTime() - Date.now()) / 86400000)
    : null;
  const statusLabel =
    c.status === "trial"
      ? `Trial · ${trialDias}d restantes`
      : c.status === "cancelada"
        ? "Cancelada"
        : c.status === "inadimplente"
          ? "Inadimplente"
          : c.status === "ativa"
            ? "Ativa"
            : "Sem assinatura";

  return (
    <tr className="border-t hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{c.nome}</p>
            <p className="truncate text-xs text-muted-foreground">
              {c.email_principal ?? "—"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
            planoCor(c.plano_tier),
          )}
        >
          {c.plano_nome ?? "—"}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            statusCor(c.status),
          )}
        >
          {c.status === "inadimplente" && (
            <AlertTriangle className="h-3 w-3" />
          )}
          {statusLabel}
        </span>
      </td>
      <td className="px-4 py-3 font-medium">{fmtBRL(c.mrr_centavos)}</td>
      <td className="px-4 py-3 text-muted-foreground">{fmtMes(c.criada_em)}</td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Ver">
            <Link to={`/clientes/${c.empresa_id}`}>
              <Eye />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Impersonar">
            <UserCog />
          </Button>
        </div>
      </td>
    </tr>
  );
}
