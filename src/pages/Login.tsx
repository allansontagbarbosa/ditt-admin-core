import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


export default function Login() {
  const { signIn, isStaff, loading } = useStaffAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!loading && isStaff) {
      navigate("/", { replace: true });
    }
  }, [loading, isStaff, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, pwd);
    } catch (err: any) {
      toast.error(err?.message ?? "Login inválido");
      setSubmitting(false);
    }
  };

  const requestPasswordReset = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Informe o email antes de redefinir a senha.");
      return;
    }

    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Enviamos um link para redefinir sua senha.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary mx-auto mb-4 flex items-center justify-center text-primary-foreground font-bold text-xl">
            d
          </div>
          <h1 className="text-2xl font-semibold">ditt admin</h1>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            required
            className="w-full h-10 px-3 rounded border border-input bg-background"
          />
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="senha"
            required
            className="w-full h-10 px-3 rounded border border-input bg-background"
          />
          <Button
            type="submit"
            disabled={submitting || loading}
            className="w-full h-10"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={resetting || submitting}
            onClick={requestPasswordReset}
            className="w-full h-9 text-xs"
          >
            {resetting ? "Enviando..." : "Esqueci minha senha"}
          </Button>
          <p className="text-xs text-muted-foreground text-center pt-2">
            Acesso restrito à equipe Ditt.
          </p>
        </form>
      </div>
    </div>
  );
}