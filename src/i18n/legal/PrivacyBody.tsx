import { useI18n } from "@/i18n";

export function PrivacyBody() {
  const { locale } = useI18n();

  if (locale === "fr") {
    return (
      <>
        <p>
          SwiftDrop (« nous », « notre ») respecte votre vie privée. Cette politique explique comment
          nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez
          notre site, nos applications et services associés (les « Services »).
        </p>
        <h2>1. Informations collectées</h2>
        <ul>
          <li>
            <strong>Données de compte :</strong> nom, e-mail, téléphone et identifiants d'authentification
            fournis à l'inscription.
          </li>
          <li>
            <strong>Commandes et livraison :</strong> adresses, contenu du panier, historique,
            communications avec le support et statut de livraison.
          </li>
          <li>
            <strong>Données techniques :</strong> appareil, navigateur, adresse IP et journaux pour la
            sécurité et l'amélioration du service.
          </li>
        </ul>
        <h2>2. Utilisation des informations</h2>
        <p>
          Nous utilisons vos données pour traiter les commandes, coordonner commerces et livreurs,
          communiquer avec vous, prévenir la fraude et améliorer nos Services.
        </p>
        <h2>3. Partage</h2>
        <p>
          Nous partageons les informations nécessaires avec les commerces et livreurs pour exécuter
          votre commande, ainsi qu'avec des prestataires d'infrastructure (hébergement, paiement,
          messagerie) sous contrat de confidentialité.
        </p>
        <h2>4. Conservation et sécurité</h2>
        <p>
          Nous conservons les données aussi longtemps que nécessaire aux fins décrites et appliquons des
          mesures techniques et organisationnelles raisonnables pour les protéger.
        </p>
        <h2>5. Vos droits</h2>
        <p>
          Selon votre juridiction, vous pouvez demander l'accès, la rectification ou la suppression de
          vos données en nous contactant à{" "}
          <a href="mailto:privacy@swiftdrop.app" className="text-primary hover:underline">
            privacy@swiftdrop.app
          </a>
          .
        </p>
        <h2>6. Contact</h2>
        <p>
          Questions sur cette politique :{" "}
          <a href="mailto:privacy@swiftdrop.app" className="text-primary hover:underline">
            privacy@swiftdrop.app
          </a>
        </p>
      </>
    );
  }

  return (
    <>
      <p>
        SwiftDrop ("we," "us," or "our") respects your privacy. This Privacy Policy explains how we
        collect, use, disclose, and safeguard information when you use our website, mobile apps, and
        related services (the "Services").
      </p>
      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> name, email, phone number, and authentication details you
          provide when you register.
        </li>
        <li>
          <strong>Order and delivery data:</strong> addresses, cart contents, order history,
          communications with support, and delivery status.
        </li>
        <li>
          <strong>Technical data:</strong> device, browser, IP address, and logs for security and
          service improvement.
        </li>
      </ul>
      <h2>2. How we use information</h2>
      <p>
        We use your data to process orders, coordinate stores and riders, communicate with you,
        prevent fraud, and improve our Services.
      </p>
      <h2>3. How we share information</h2>
      <p>
        We share necessary information with stores and riders to fulfill your order, and with
        infrastructure providers (hosting, payments, messaging) under confidentiality agreements.
      </p>
      <h2>4. Retention and security</h2>
      <p>
        We retain data as long as needed for the purposes described and apply reasonable technical
        and organizational measures to protect it.
      </p>
      <h2>5. Your choices and rights</h2>
      <p>
        Depending on your jurisdiction, you may request access, correction, or deletion of your
        data by contacting us at{" "}
        <a href="mailto:privacy@swiftdrop.app" className="text-primary hover:underline">
          privacy@swiftdrop.app
        </a>
        .
      </p>
      <h2>6. Contact</h2>
      <p>
        Questions about this policy:{" "}
        <a href="mailto:privacy@swiftdrop.app" className="text-primary hover:underline">
          privacy@swiftdrop.app
        </a>
      </p>
    </>
  );
}
