import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StaffUser {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  role: "owner" | "suporte" | "vendas" | "financeiro";
}

export function useStaffAuth() {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStaff(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .schema("admin" as any)
        .from("usuarios_internos" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("ativo", true)
        .maybeSingle();
      setStaff((data as any) ?? null);
      setLoading(false);
    };
    checkAuth();
    const { data: sub } = supabase.auth.onAuthStateChange(() => checkAuth());
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setStaff(null);
  };

  return { staff, loading, signIn, signOut, isStaff: !!staff };
}