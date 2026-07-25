import { useEffect, useState } from "react";

type StaffProfile = {
  user_id: string;
  email: string;
  nome: string;
  role: "owner";
};

const STORAGE_KEY = "ditt-admin-master-session";
const MASTER_EMAIL = (import.meta.env.VITE_MASTER_EMAIL ?? "").trim().toLowerCase();
const MASTER_PASSWORD = import.meta.env.VITE_MASTER_PASSWORD ?? "";

function buildProfile(): StaffProfile {
  return {
    user_id: "master",
    email: MASTER_EMAIL,
    nome: MASTER_EMAIL ? MASTER_EMAIL.split("@")[0] : "Master",
    role: "owner",
  };
}

export function useStaffAuth() {
  const [isStaff, setIsStaff] = useState<boolean>(false);
  const [staffData, setStaffData] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY) === "1") {
        setIsStaff(true);
        setStaffData(buildProfile());
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!MASTER_EMAIL || !MASTER_PASSWORD) {
      throw new Error("Credenciais master não configuradas (VITE_MASTER_EMAIL / VITE_MASTER_PASSWORD).");
    }
    const normalized = email.trim().toLowerCase();
    if (normalized !== MASTER_EMAIL || password !== MASTER_PASSWORD) {
      throw new Error("Credenciais inválidas.");
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setIsStaff(true);
    setStaffData(buildProfile());
  };

  const signOut = async () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setIsStaff(false);
    setStaffData(null);
  };

  return { isStaff, staff: staffData, loading, signIn, signOut };
}
