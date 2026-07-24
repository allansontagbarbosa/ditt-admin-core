import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type StaffProfile = {
  user_id: string;
  email: string;
  nome: string;
  role: "admin" | "moderator";
};

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

        const { data: role, error: roleError } = await supabase
          .from("user_roles" as any)
          .select("role")
          .eq("user_id", user.id)
          .in("role", ["admin", "moderator"])
          .order("role", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (roleError) throw roleError;

        const staff = role
          ? {
              user_id: user.id,
              email: user.email ?? "",
              nome:
                (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
                (user.email ? user.email.split("@")[0] : "Staff"),
              role: (role as { role: "admin" | "moderator" }).role,
            }
          : null;

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
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsStaff(false);
    setStaffData(null);
  };

  return { isStaff, staff: staffData, loading, signIn, signOut };
}
