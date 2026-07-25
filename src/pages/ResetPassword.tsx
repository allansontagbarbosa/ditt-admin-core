import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkRecoverySession = async () => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const queryParams = new URLSearchParams(window.location.search);
      const type = hashParams.get("type") ?? queryParams.get("type");
      const hasRecoveryToken = type === "recovery" || hashParams.has("access_token");

      if (!hasRecoveryToken) {
        if (mounted) setReady(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (mounted) setReady(Boolean(data.session));
    };

    checkRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < 8) {
      toast.error("Use uma senha com pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não conferem.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Senha atualizada. Entre novamente.");
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary mx-auto mb-4 flex items-center justify-center text-primary-foreground font-bold text-xl">
            d
          </div>
          <h1 className="text-2xl font-semibold">nova senha</h1>
        </div>

        {ready ? (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="nova senha"
              required
              className="w-full h-10 px-3 rounded border border-input bg-background"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="confirmar senha"
              required
              className="w-full h-10 px-3 rounded border border-input bg-background"
            />
            <Button type="submit" disabled={submitting} className="w-full h-10">
              {submitting ? "Salvando..." : "Salvar senha"}
            </Button>
          </form>
        ) : (
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              Link inválido ou expirado. Solicite uma nova redefinição de senha.
            </p>
            <Button type="button" className="w-full h-10" onClick={() => navigate("/login", { replace: true })}>
              Voltar ao login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}