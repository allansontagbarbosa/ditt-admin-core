import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function DebugAuth() {
  const [logs, setLogs] = useState<string[]>([]);

  const log = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toISOString().slice(11, 19)}] ${msg}`]);
    console.log(msg);
  };

  const runDiagnostic = async () => {
    setLogs([]);
    log("=== DIAGNÓSTICO INICIADO ===");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      log(`Sessão atual: ${session ? "EXISTE (user=" + session.user.email + ")" : "VAZIA"}`);

      if (!session) {
        log("Tentando login direto...");
        const { data, error } = await supabase.auth.signInWithPassword({
          email: "allan@ditt.com.br",
          password: "D1tt-Adm!n#2026-Sx9P",
        });
        if (error) { log("ERRO LOGIN: " + error.message); return; }
        log("Login OK: " + data.user?.email);
      }

      log("Chamando RPC is_staff...");
      const { data: rpcData, error: rpcErr } = await supabase.rpc("is_staff" as any);
      if (rpcErr) log("ERRO RPC: " + JSON.stringify(rpcErr));
      else log("RPC is_staff retornou: " + JSON.stringify(rpcData));

      log("Buscando usuarios_internos via fetch direto...");
      const { data: { session: s2 } } = await supabase.auth.getSession();
      const r = await fetch(
        `https://cgsdnvuigolxwzfmnykk.supabase.co/rest/v1/usuarios_internos?user_id=eq.${s2!.user.id}&ativo=eq.true&select=*`,
        {
          headers: {
            "apikey": "sb_publishable_8--rytxIxWlNNp2T9IUFsw_ems9dlOH",
            "Authorization": `Bearer ${s2!.access_token}`,
            "Accept-Profile": "admin",
          },
        }
      );
      const arr = await r.json();
      log(`Fetch usuarios_internos: status=${r.status}, length=${Array.isArray(arr) ? arr.length : "N/A"}`);
      log("Dados: " + JSON.stringify(arr));

      log("=== FIM DO DIAGNÓSTICO ===");
    } catch (e: any) {
      log("EXCEÇÃO: " + e.message);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-[480px] max-h-[60vh] overflow-auto bg-black text-green-400 text-xs font-mono p-3 rounded shadow-lg border border-green-700 z-50">
      <button
        onClick={runDiagnostic}
        className="mb-2 px-3 py-1 bg-green-700 text-white rounded hover:bg-green-600"
      >
        RODAR DIAGNÓSTICO
      </button>
      {logs.map((l, i) => (
        <pre key={i} className="whitespace-pre-wrap break-all">{l}</pre>
      ))}
    </div>
  );
}
