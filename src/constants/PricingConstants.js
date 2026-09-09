/**
 * @deprecated Legacy monthly plans — Studio uses constants/plans.js CREDIT_PACKS.
 */
export const PricingConstants = {
  plans: [
    {
      title: "Starter",
      monthly: "$5",
      features: ["100 credits", "Credits never expire"],
    },
    {
      title: "Studio",
      monthly: "$15",
      features: ["350 credits", "Bonus pack rate"],
    },
    {
      title: "Pro",
      monthly: "$40",
      features: ["1,000 credits", "Best rate per credit"],
    },
  ],
};

export default PricingConstants;
