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

export async function recoverStripeProfile(
  supabase: SupabaseClient,
  profile: Record<string, any>,
  email?: string | null,
  ignoreStoredCustomer = false
) {
  const stripe = getStripe();
  const customerIds: string[] = [];

  if (!ignoreStoredCustomer && profile.stripe_customer_id) {
    try {
      const customer = await stripe.customers.retrieve(profile.stripe_customer_id);
      if (!customer.deleted) customerIds.push(customer.id);
    } catch {
      // A test-mode or deleted Customer must not keep a live account stuck.
    }
  }

  if (email) {
    const customers = await stripe.customers.list({ email, limit: 10 });
    customers.data
      .filter((item) => !item.deleted)
      .sort((a, b) => b.created - a.created)
      .forEach((customer) => {
        if (!customerIds.includes(customer.id)) customerIds.push(customer.id);
      });
  }

  if (customerIds.length === 0) {
    if (!ignoreStoredCustomer && !profile.stripe_customer_id) return profile;

    const { data, error } = await supabase
      .from("profiles")
      .update({
        stripe_customer_id: null,
        stripe_subscription_id: null,
        subscription_status: null,
        current_period_end: null,
        trial_ends_at: null
      })
      .eq("user_id", profile.user_id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const subscriptions: Stripe.Subscription[] = [];
  for (const customerId of customerIds) {
    const customerSubscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
    subscriptions.push(...customerSubscriptions.data);
  }
  const priority = new Map([["active", 4], ["trialing", 3], ["past_due", 2], ["unpaid", 1]]);
  const subscription = subscriptions.sort((a, b) => {
    const statusDifference = (priority.get(b.status) ?? 0) - (priority.get(a.status) ?? 0);
    return statusDifference || b.created - a.created;
  })[0];

  if (subscription) {
    return syncStripeSubscriptionProfile(supabase, {
      ...profile,
      stripe_customer_id: String(subscription.customer),
      stripe_subscription_id: subscription.id
    });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      stripe_customer_id: customerIds[0],
      stripe_subscription_id: null,
      subscription_status: null,
      current_period_end: null,
      trial_ends_at: null
    })
    .eq("user_id", profile.user_id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}
