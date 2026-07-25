import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://cgsdnvuigolxwzfmnykk.supabase.co";
const SUPABASE_KEY = "sb_publishable_8--rytxIxWlNNp2T9IUFsw_ems9dlOH";

type StaffProfile = {
  user_id: string;
  email: string;
  nome: string;
  role: "admin" | "moderator";
};

async function getStaffProfile(user: User): Promise<StaffProfile | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return null;

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/usuarios_internos?select=user_id,email,nome,role,ativo&user_id=eq.${user.id}&ativo=eq.true&limit=1`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`,
        "Accept-Profile": "admin",
      },
    }
  );

  if (!res.ok) return null;
  const rows = (await res.json()) as Array<StaffProfile & { ativo: boolean }>;
  if (!rows.length) return null;
  const r = rows[0];
  return {
    user_id: r.user_id,
    email: r.email,
    nome: r.nome ?? (user.email?.split("@")[0] ?? "Staff"),
    role: r.role,
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
