import { useState } from "react";
import { useClientes } from "@/hooks/useClientes";
import { Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

      {/* Tabela vem no PROMPT 10. Por enquanto: */}
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        {isLoading
          ? "Carregando..."
          : `${clientes.length} empresas carregadas. Tabela vem no PROMPT 10.`}
      </div>
    </div>
  );
}
