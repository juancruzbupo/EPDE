/**
 * Landing page content types.
 *
 * These types are web-only: the admin panel edits them and the public
 * landing page renders them. Mobile never touches landing content, so
 * keeping them here avoids bloating @epde/shared with admin-specific shapes.
 */

export interface LandingPricing {
  price: string;
  priceNote: string;
  subscriptionMicrocopy: string;
  costDisclaimer: string;
}

export interface LandingFaqItem {
  question: string;
  answer: string;
}

export interface LandingConsequenceExample {
  problem: string;
  preventive: string;
  emergency: string;
}

export interface LandingGeneral {
  phone: string;
  socialProof: string;
}
