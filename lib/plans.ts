export type PlanId = "basic" | "pro" | "premium";

export const plans = {
  basic: {
    id: "basic",
    name: "Basic",
    price: "19 €",
    quota: 50,
    stripeEnv: "STRIPE_PRICE_BASIC",
    description: "Pienelle yritykselle tai kevyelle kuukausikäytölle."
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: "39 €",
    quota: 100,
    stripeEnv: "STRIPE_PRICE_PRO",
    description: "Aktiiviseen käyttöön, kun kuitteja kertyy säännöllisesti."
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: "89 €",
    quota: 500,
    stripeEnv: "STRIPE_PRICE_PREMIUM",
    description: "Yrityksille ja toimistoille, joilla on suurempi kuittimäärä."
  }
} satisfies Record<PlanId, {
  id: PlanId;
  name: string;
  price: string;
  quota: number;
  stripeEnv: string;
  description: string;
}>;

export function getPlan(plan: string | null | undefined) {
  if (plan === "basic" || plan === "pro" || plan === "premium") {
    return plans[plan];
  }
  return null;
}
