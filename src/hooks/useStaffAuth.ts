import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://cgsdnvuigolxwzfmnykk.supabase.co";
const SUPABASE_KEY = "sb_publishable_8--rytxIxWlNNp2T9IUFsw_ems9dlOH";

export function useStaffAuth() {
  const [isStaff, setIsStaff] = useState<boolean>(false);
  const [staffData, setStaffData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (mounted) {
            setIsStaff(false);
            setStaffData(null);
            setLoading(false);
          }
          return;
        }

        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/usuarios_internos?user_id=eq.${session.user.id}&ativo=eq.true&select=*`,
          {
            headers: {
              "apikey": SUPABASE_KEY,
              "Authorization": `Bearer ${session.access_token}`,
              "Accept-Profile": "admin",
            },
          }
        );

        let staff = null;
        if (r.ok) {
          const arr = await r.json();
          staff = Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
        } else {
          console.error("[useStaffAuth] staff fetch falhou:", r.status, await r.text());
        }

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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsStaff(false);
    setStaffData(null);
  };

  return { isStaff, staff: staffData, loading, signIn, signOut };
}
