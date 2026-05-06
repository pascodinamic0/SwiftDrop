import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LegalDocument } from "@/components/LegalDocument";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy — SwiftDrop" },
      {
        name: "description",
        content: "How SwiftDrop collects, uses, and protects your personal information.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4">
        <LegalDocument title="Privacy policy" updated="May 6, 2026">
          <p>
            SwiftDrop ("we," "us," or "our") respects your privacy. This Privacy Policy explains how
            we collect, use, disclose, and safeguard information when you use our website, mobile
            apps, and related services (the "Services").
          </p>

          <h2>1. Information we collect</h2>
          <ul>
            <li>
              <strong>Account data:</strong> name, email, phone number, and authentication details
              you provide when you register.
            </li>
            <li>
              <strong>Order and delivery data:</strong> addresses, cart contents, order history,
              communications with support, and delivery status.
            </li>
            <li>
              <strong>Device and usage data:</strong> IP address, browser type, app version,
              diagnostic logs, and how you interact with the Services.
            </li>
            <li>
              <strong>Location data:</strong> with your permission, approximate or precise location
              to show nearby stores, estimate delivery times, and facilitate deliveries.
            </li>
            <li>
              <strong>Payment data:</strong> payment details are processed by our payment partners;
              we typically receive limited tokenized information rather than full card numbers.
            </li>
          </ul>

          <h2>2. How we use information</h2>
          <p>We use information to:</p>
          <ul>
            <li>Create and manage your account, process payments, and fulfill orders.</li>
            <li>Connect you with Merchants and Riders and provide customer support.</li>
            <li>Improve and secure the Services, prevent fraud, and comply with law.</li>
            <li>
              Send transactional messages and, where allowed, marketing (you can opt out of
              marketing).
            </li>
          </ul>

          <h2>3. How we share information</h2>
          <p>We may share information with:</p>
          <ul>
            <li>
              <strong>Merchants and Riders</strong> as needed to prepare and complete your order
              (for example, name, phone, and delivery address).
            </li>
            <li>
              <strong>Service providers</strong> who assist us with hosting, analytics,
              communications, payments, and security — under contracts that limit their use of data.
            </li>
            <li>
              <strong>Authorities</strong> when required by law or to protect rights, safety, and
              integrity of our users and the public.
            </li>
            <li>
              <strong>Business transfers</strong> in connection with a merger, acquisition, or sale
              of assets, subject to appropriate safeguards.
            </li>
          </ul>
          <p>We do not sell your personal information for money.</p>

          <h2>4. Retention</h2>
          <p>
            We retain information as long as needed to provide the Services, meet legal obligations,
            resolve disputes, and enforce our agreements. Retention periods may vary by data type
            and jurisdiction.
          </p>

          <h2>5. Security</h2>
          <p>
            We use administrative, technical, and organizational measures designed to protect
            information. No method of transmission or storage is 100% secure; we cannot guarantee
            absolute security.
          </p>

          <h2>6. Your choices and rights</h2>
          <p>
            Depending on where you live, you may have rights to access, correct, delete, or export
            certain personal information, or to object to or restrict certain processing. You may
            also have the right to lodge a complaint with a supervisory authority. To exercise
            rights, contact us at the email below.
          </p>

          <h2>7. Children</h2>
          <p>
            The Services are not directed to children under 13 (or the age required in your region).
            We do not knowingly collect their data.
          </p>

          <h2>8. International transfers</h2>
          <p>
            We may process information in countries other than where you live. Where required, we
            use appropriate safeguards for cross-border transfers.
          </p>

          <h2>9. Changes</h2>
          <p>
            We may update this Privacy Policy from time to time. We will post the updated policy
            with a new "Last updated" date and, where appropriate, notify you through the Services.
          </p>

          <h2>10. Contact</h2>
          <p>
            Privacy questions or requests:{" "}
            <a
              href="mailto:privacy@swiftdrop.app"
              className="text-primary font-medium hover:underline"
            >
              privacy@swiftdrop.app
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
