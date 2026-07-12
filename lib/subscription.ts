import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "./stripe";

type SubscriptionWithPeriods = Stripe.Subscription & {
  current_period_end?: number;
  trial_end?: number | null;
  items: Stripe.Subscription["items"] & {
    data: Array<Stripe.SubscriptionItem & { current_period_end?: number }>;
  };
};

export function subscriptionPeriodEnd(subscription: SubscriptionWithPeriods) {
  if (subscription.current_period_end) return subscription.current_period_end;
  const items = subscription.items.data as Array<Stripe.SubscriptionItem & { current_period_end?: number }>;
  return Math.max(0, ...items.map((item) => item.current_period_end ?? 0)) || null;
}

export async function syncStripeSubscriptionProfile(
  supabase: SupabaseClient,
  profile: Record<string, any>
) {
  if (!profile.stripe_subscription_id) return profile;

  const subscription = await getStripe().subscriptions.retrieve(profile.stripe_subscription_id) as SubscriptionWithPeriods;
  const periodEnd = subscriptionPeriodEnd(subscription);
  const patch: Record<string, unknown> = {
    stripe_customer_id: String(subscription.customer),
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null
  };
  if (subscription.trial_end) {
    patch.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString();
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("user_id", profile.user_id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}
