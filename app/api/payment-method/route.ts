import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";
import { getStripe } from "../../../lib/stripe";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { data: profile, error } = await auth.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile for payment method:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ 
        error: "Luo profiili ensin. Tallenna yritystiedot ja yritä uudelleen." 
      }, { status: 400 });
    }

    if (!profile?.company_name || !profile?.business_id) {
      console.warn("Missing profile data for user", auth.user.id, { 
        hasCompanyName: !!profile?.company_name,
        hasBusinessId: !!profile?.business_id 
      });
      return NextResponse.json({ 
        error: "Tallenna yritystiedot ennen maksutavan lisäämistä." 
      }, { status: 400 });
    }

    const stripe = getStripe();
    let customerId = profile.stripe_customer_id as string | null;

    if (customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) customerId = null;
      } catch {
        customerId = null;
      }
    }

    if (!customerId && auth.user.email) {
      const customers = await stripe.customers.list({ email: auth.user.email, limit: 10 });
      const customer = customers.data
        .filter((item) => !item.deleted)
        .sort((a, b) => b.created - a.created)[0];
      customerId = customer?.id ?? null;
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: auth.user.email,
        name: profile.company_name,
        metadata: {
          user_id: auth.user.id,
          company_name: profile.company_name,
          business_id: profile.business_id,
          vat_id: profile.vat_id ?? ""
        }
      }, { idempotencyKey: `checkapp-customer-${auth.user.id}` });
      customerId = customer.id;
    }

    const { error: updateError } = await auth.supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", auth.user.id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const savedPaymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
      limit: 1
    });

    const savedPaymentMethod = savedPaymentMethods.data[0] ?? null;
    const { error: paymentStateError } = await auth.supabase
      .from("profiles")
      .update({
        payment_method_ready: Boolean(savedPaymentMethod),
        stripe_payment_method_id: savedPaymentMethod?.id ?? null,
        ...(savedPaymentMethod ? { payment_method_added_at: new Date().toISOString() } : {})
      })
      .eq("user_id", auth.user.id);
    if (paymentStateError) console.error("Payment method state sync failed", paymentStateError);

    if (savedPaymentMethod) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${siteUrl}/dashboard`
      });
      return NextResponse.json({ destination: "portal", url: portalSession.url });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: customerId,
      payment_method_types: ["card"],
      success_url: `${siteUrl}/dashboard?payment_method=processing`,
      cancel_url: `${siteUrl}/dashboard?payment_method=cancelled`,
      billing_address_collection: "required",
      customer_update: {
        address: "auto",
        name: "auto"
      },
      metadata: {
        user_id: auth.user.id,
        flow: "save_payment_method"
      },
      setup_intent_data: {
        metadata: {
          user_id: auth.user.id,
          flow: "save_payment_method"
        }
      }
    });

    return NextResponse.json({ destination: "checkout", url: session.url });
  } catch (err) {
    console.error("Payment method error:", err);
    return NextResponse.json({ 
      error: "Maksutavan avaaminen epäonnistui. Yritä uudelleen." 
    }, { status: 500 });
  }
}
