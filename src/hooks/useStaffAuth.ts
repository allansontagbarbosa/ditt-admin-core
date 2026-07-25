import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type StaffRole = "owner" | "suporte" | "vendas" | "financeiro";

type StaffProfile = {
  user_id: string;
  email: string;
  nome: string;
  role: StaffRole;
};

async function getStaffProfile(user: User): Promise<StaffProfile | null> {
  const { data, error } = await supabase
    .schema("admin" as any)
    .from("usuarios_internos" as any)
    .select("user_id,email,nome,role,ativo")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .maybeSingle();

  if (error) throw error;
  const row = data as unknown as
    | { user_id: string; email: string; nome: string; role: StaffRole; ativo: boolean }
    | null;
  if (!row) return null;

  return {
    user_id: row.user_id,
    email: row.email ?? user.email ?? "",
    nome: row.nome || (user.email ? user.email.split("@")[0] : "Staff"),
    role: row.role,
  };
}

export function useStaffAuth() {
  const [isStaff, setIsStaff] = useState<boolean>(false);
  const [staffData, setStaffData] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          if (mounted) {
            setIsStaff(false);
            setStaffData(null);
            setLoading(false);
          }
          return;
        }

        const staff = await getStaffProfile(user);

        if (mounted) {
          setIsStaff(!!staff);
          setStaffData(staff);
          setLoading(false);
        }
      } catch (err) {
        console.error("[useStaffAuth] erro:", err);
        if (mounted) {
          setIsStaff(false);
          setStaffData(null);
          setLoading(false);
        }
      }
    };

    check();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      if (mounted) {
        setLoading(true);
        check();
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;

    const user = data.user;
    if (!user) throw new Error("Não foi possível validar o usuário.");

    const staff = await getStaffProfile(user);
    if (!staff) {
      await supabase.auth.signOut();
      setIsStaff(false);
      setStaffData(null);
      throw new Error("Usuário autenticado, mas sem acesso interno ativo.");
    }

    setIsStaff(true);
    setStaffData(staff);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsStaff(false);
    setStaffData(null);
  };

  return { isStaff, staff: staffData, loading, signIn, signOut };
}
