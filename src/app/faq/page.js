import Link from "next/link";

const faqs = [
  ["What is an IMEI number?", "An IMEI (International Mobile Equipment Identity) is a unique identifier associated with a mobile device. A standard IMEI contains 15 digits."],
  ["How can I find my IMEI?", "On many phones you can dial *#06# to display the IMEI. You can also find it in the device settings, on the original packaging, or in purchase documentation."],
  ["What is a TAC?", "TAC stands for Type Allocation Code. It is the first eight digits of an IMEI and is used to associate a device type with allocation and database information."],
  ["Can I check an IMEI before buying a used phone?", "Yes. An IMEI lookup can help you compare the device information returned by the database with the phone you are considering buying. It should be combined with a normal physical inspection and ownership checks."],
  ["Why does a phone sometimes have two IMEIs?", "Many dual-SIM and multi-cellular devices have more than one IMEI. Each cellular identity can have its own IMEI, depending on the device hardware."],
  ["Does an IMEI lookup reveal my private files or messages?", "No. An IMEI is a device identifier. A normal database lookup returns information associated with that identifier; it does not provide access to your private photos, messages or files."],
  ["What is the difference between IMEI and EID?", "IMEI identifies the mobile device on cellular networks, while EID is an identifier associated with the eSIM environment on compatible devices. They are different identifiers."],
  ["What should I do if the returned model does not match my phone?", "Double-check the IMEI you entered and compare it with the IMEI shown on the phone or its packaging. If the mismatch remains, treat it as something that should be clarified before buying the device."],
  ["Is the IMEI checker free?", "The public checker in this project is intended to provide a straightforward device lookup without requiring a paid subscription for the basic check."],
  ["Should I share my IMEI publicly?", "It is better not to publish the full IMEI unnecessarily. Share it only with services or people that genuinely need it and avoid exposing it in public screenshots or posts."],
];

export default function FaqPage() {
  return (
    <div className="modern-page-shell faq-page">
      <div className="faq-hero">
        <span className="section-eyebrow">HELP CENTER</span>
        <h1>Frequently asked questions</h1>
        <p>
          Quick answers about IMEI numbers, TACs, device checks and the tools
          available on IMEI.net.
        </p>
      </div>

      <div className="faq-layout">
        <div className="faq-list">
          {faqs.map(([question, answer], index) => (
            <details className="faq-item" key={question} open={index === 0}>
              <summary>
                <span>{question}</span>
                <i className="fas fa-plus" />
              </summary>
              <div className="faq-answer"><p>{answer}</p></div>
            </details>
          ))}
        </div>

        <aside className="faq-side-card">
          <div className="news-icon"><i className="fas fa-mobile-screen-button" /></div>
          <span className="section-eyebrow">STILL NEED HELP?</span>
          <h2>Check the device directly.</h2>
          <p>Enter a valid 15-digit IMEI and compare the returned device information.</p>
          <Link href="/" className="primary-action">Check IMEI <i className="fas fa-arrow-right" /></Link>
        </aside>
      </div>
    </div>
  );
}
