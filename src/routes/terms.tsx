import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LegalDocument } from "@/components/LegalDocument";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of service — SwiftDrop" },
      {
        name: "description",
        content: "Terms governing use of the SwiftDrop marketplace and delivery services.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4">
        <LegalDocument title="Terms of service" updated="May 6, 2026">
          <p>
            These Terms of Service ("Terms") govern your access to and use of SwiftDrop's website,
            apps, and delivery marketplace (collectively, the "Services"). By using SwiftDrop, you
            agree to these Terms. If you do not agree, do not use the Services.
          </p>

          <h2>1. The SwiftDrop marketplace</h2>
          <p>
            SwiftDrop provides a platform that connects customers with independent stores
            ("Merchants") and independent delivery partners ("Riders"). SwiftDrop is not the
            merchant of record for items you order unless we say otherwise. Prices, availability,
            and fulfillment are determined by Merchants. Delivery is performed by Riders or third
            parties.
          </p>

          <h2>2. Accounts</h2>
          <p>
            You must provide accurate information and keep your credentials secure. You are
            responsible for activity under your account. We may suspend or terminate accounts that
            violate these Terms or pose risk to others.
          </p>

          <h2>3. Orders and payments</h2>
          <p>
            When you place an order, you authorize us and our payment partners to charge your
            selected payment method for items and applicable fees as disclosed at checkout. Some
            Merchants or regions may require a cash payment for delivery fees or other amounts at
            drop-off — when that applies, it will be shown clearly before you confirm your order.
          </p>
          <ul>
            <li>Item totals, taxes, service fees, and delivery fees are shown before you pay.</li>
            <li>
              Cancellations and refunds follow the policy shown in-app and may depend on order
              status and Merchant rules.
            </li>
          </ul>

          <h2>4. Delivery</h2>
          <p>
            Estimated times are estimates only. Weather, traffic, store preparation, and other
            factors can affect delivery. You agree to provide a safe, accessible drop-off location
            and to receive the order or designate someone who can.
          </p>

          <h2>5. Prohibited conduct</h2>
          <p>
            You may not misuse the Services, harass Riders or Merchants, commit fraud, circumvent
            fees, or violate applicable law.
          </p>

          <h2>6. Disclaimers</h2>
          <p>
            The Services are provided "as is" to the fullest extent permitted by law. We do not
            warrant uninterrupted or error-free operation. To the extent allowed by law, we disclaim
            implied warranties of merchantability and fitness for a particular purpose.
          </p>

          <h2>7. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, SwiftDrop and its affiliates will not be liable
            for indirect, incidental, special, consequential, or punitive damages, or for lost
            profits or data. Our aggregate liability for claims arising out of the Services is
            limited to the greater of (a) the amounts you paid to SwiftDrop for the Services in the
            three months before the claim or (b) one hundred dollars (US $100), except where
            prohibited by law.
          </p>

          <h2>8. Changes</h2>
          <p>
            We may update these Terms from time to time. We will post the updated Terms with a new
            "Last updated" date. Continued use after changes means you accept the revised Terms.
          </p>

          <h2>9. Contact</h2>
          <p>
            Questions about these Terms? Email{" "}
            <a
              href="mailto:legal@swiftdrop.app"
              className="text-primary font-medium hover:underline"
            >
              legal@swiftdrop.app
            </a>
            .
          </p>
        </LegalDocument>
        <p className="text-center text-sm text-muted-foreground pb-12">
          <Link to="/" className="hover:text-primary">
            ← Back home
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
