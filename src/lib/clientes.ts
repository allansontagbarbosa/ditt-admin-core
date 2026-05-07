export const fmtBRL = (c: number | null) =>
  c == null ? "—" : (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtMes = (iso: string | null) =>
  !iso ? "—" : new Date(iso).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });

export const planoCor = (t: string | null) => {
  if (t === "enterprise") return "bg-purple-100 text-purple-800";
  if (t === "pro") return "bg-primary/15 text-primary";
  if (t === "starter") return "bg-primary/10 text-primary";
  return "bg-muted text-muted-foreground";
};

export const statusCor = (s: string | null) => {
  if (s === "ativa") return "bg-primary/15 text-primary";
  if (s === "trial") return "bg-amber-100 text-amber-800";
  if (s === "inadimplente") return "bg-red-100 text-red-800";
  return "bg-muted text-muted-foreground";
};
