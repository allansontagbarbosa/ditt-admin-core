import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

        const { data: rpcResult, error: rpcError } = await supabase.rpc("is_staff" as any);
        const userIsStaff = rpcResult === true;

        if (rpcError) {
          console.error("[useStaffAuth] is_staff RPC error:", rpcError);
        }

        let staff = null;
        if (userIsStaff) {
          const fetchUrl = `${import.meta.env.VITE_SUPABASE_URL || "https://cgsdnvuigolxwzfmnykk.supabase.co"}/rest/v1/usuarios_internos?user_id=eq.${session.user.id}&ativo=eq.true&select=*`;
          const r = await fetch(fetchUrl, {
            headers: {
              "apikey": "sb_publishable_8--rytxIxWlNNp2T9IUFsw_ems9dlOH",
              "Authorization": `Bearer ${session.access_token}`,
              "Accept-Profile": "admin",
            },
          });
          if (r.ok) {
            const arr = await r.json();
            staff = Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
          } else {
            console.error("[useStaffAuth] staff fetch failed:", r.status, await r.text());
          }
        }

        if (mounted) {
          setIsStaff(userIsStaff);
          setStaffData(staff);
          setLoading(false);
        }
      } catch (err) {
        console.error("[useStaffAuth] check error:", err);
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