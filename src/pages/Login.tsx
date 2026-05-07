import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { toast } from "sonner";

export default function Login() {
  const { signIn } = useStaffAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, pwd);
      navigate("/");
    } catch {
      toast.error("Login inválido");
    } finally {
      setLoading(false);
    }
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
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded bg-primary text-primary-foreground font-medium disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <p className="text-xs text-muted-foreground text-center pt-2">
            Acesso restrito à equipe Ditt.
          </p>
        </form>
      </div>
    </div>
  );
}