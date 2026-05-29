import { useI18n } from "@/i18n";

export function TermsBody() {
  const { locale } = useI18n();

  if (locale === "fr") {
    return (
      <>
        <p>
          En utilisant SwiftDrop, vous acceptez ces conditions. Si vous n'êtes pas d'accord, n'utilisez
          pas nos Services.
        </p>
        <h2>1. La place de marché SwiftDrop</h2>
        <p>
          SwiftDrop met en relation clients, commerces locaux et livreurs indépendants. Nous ne préparons
          pas les repas ni ne livrons nous-mêmes, sauf indication contraire.
        </p>
        <h2>2. Comptes</h2>
        <p>
          Vous êtes responsable de la confidentialité de vos identifiants et de l'exactitude des
          informations fournies. Les comptes livreur et commerçant peuvent faire l'objet d'une
          vérification supplémentaire.
        </p>
        <h2>3. Commandes et paiements</h2>
        <p>
          Les articles peuvent être prépayés selon le commerce ; les frais de livraison peuvent être dus
          en espèces au livreur. Les prix et disponibilités sont fixés par les commerces.
        </p>
        <h2>4. Livraison</h2>
        <p>
          Les délais sont estimatifs. Les livreurs sont des prestataires indépendants ; SwiftDrop n'est
          pas responsable des retards dus à la circulation ou à des événements hors de notre contrôle.
        </p>
        <h2>5. Conduite interdite</h2>
        <p>
          Fraude, harcèlement, contournement des paiements ou utilisation abusive des Services peuvent
          entraîner la suspension du compte.
        </p>
        <h2>6. Contact</h2>
        <p>
          Questions juridiques :{" "}
          <a href="mailto:legal@swiftdrop.app" className="text-primary hover:underline">
            legal@swiftdrop.app
          </a>
        </p>
      </>
    );
  }

  return (
    <>
      <p>
        By using SwiftDrop, you agree to these terms. If you do not agree, do not use our Services.
      </p>
      <h2>1. The SwiftDrop marketplace</h2>
      <p>
        SwiftDrop connects customers, local stores, and independent riders. We do not prepare food or
        deliver ourselves unless stated otherwise.
      </p>
      <h2>2. Accounts</h2>
      <p>
        You are responsible for keeping your credentials secure and your information accurate. Rider
        and vendor accounts may require additional verification.
      </p>
      <h2>3. Orders and payments</h2>
      <p>
        Items may be prepaid per store policy; delivery fees may be due in cash to the rider. Prices
        and availability are set by stores.
      </p>
      <h2>4. Delivery</h2>
      <p>
        ETAs are estimates. Riders are independent contractors; SwiftDrop is not liable for delays due
        to traffic or events beyond our control.
      </p>
      <h2>5. Prohibited conduct</h2>
      <p>
        Fraud, harassment, payment circumvention, or abuse of the Services may result in account
        suspension.
      </p>
      <h2>6. Contact</h2>
      <p>
        Legal questions:{" "}
        <a href="mailto:legal@swiftdrop.app" className="text-primary hover:underline">
          legal@swiftdrop.app
        </a>
      </p>
    </>
  );
}
