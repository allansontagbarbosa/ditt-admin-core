import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { empresa_id, return_url } = await req.json();
    if (!empresa_id) return json({ success: false, error: "empresa_id obrigatório" }, 400);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-11-20.acacia" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: assinatura } = await supabase.schema("admin").from("assinaturas")
      .select("stripe_customer_id").eq("empresa_id", empresa_id).maybeSingle();

    if (!assinatura?.stripe_customer_id) {
      return json({ success: false, error: "Empresa não tem customer no Stripe ainda. Crie checkout session primeiro." }, 400);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: assinatura.stripe_customer_id,
      return_url: return_url ?? "https://app.ditt.com.br/billing",
      locale: "pt-BR",
    });

    return json({ success: true, url: session.url });
  } catch (err: any) {
    console.error("[customer-portal]", err);
    return json({ success: false, error: err.message }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}