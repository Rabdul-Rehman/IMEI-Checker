import Link from "next/link";
import { notFound } from "next/navigation";
import { articles } from "../page";

const articleBodies = {
  "what-is-an-imei-number": [
    "An IMEI is a unique identifier associated with a mobile device. It is normally 15 digits long and is used by mobile networks and device databases to distinguish one device from another.",
    "The first eight digits form the TAC (Type Allocation Code). The remaining digits identify the individual device and include the final check digit used for validation.",
    "You can usually find an IMEI by dialing *#06# or by opening the device settings. Our checker can use the IMEI to look up the device information available in the database.",
  ],
  "check-imei-before-buying-used-phone": [
    "Before buying a used phone, checking its IMEI gives you another useful piece of information about the device. It can help confirm that the device information matches what the seller is claiming.",
    "Enter the IMEI into the checker and compare the returned brand and model information with the physical phone. If the details do not match, ask the seller for clarification before completing the purchase.",
    "An IMEI lookup is one part of a used-phone inspection. You should still check the screen, cameras, battery condition, charging port, network connectivity and proof of ownership.",
  ],
  "esim-eid-and-imei-explained": [
    "IMEI identifies the physical mobile device, while an EID identifies the eSIM profile environment used by compatible devices. They are related to mobile connectivity but serve different purposes.",
    "Modern phones may also expose multiple IMEIs when they support more than one cellular connection. That is normal and depends on the hardware and network configuration.",
    "When checking a device, use the identifier requested by the service. An EID should not be treated as a replacement for an IMEI when an IMEI is specifically required.",
  ],
  "how-to-find-your-imei": [
    "The quickest method on many phones is to open the dialer and enter *#06#. The IMEI is then displayed on the screen.",
    "You can also find it in the device settings. Android menu names vary by manufacturer, while iPhone commonly places device identifiers under Settings and About.",
    "If the phone is unavailable, the original packaging or purchase documentation may also contain the IMEI. Avoid posting the full number publicly.",
  ],
  "imei-tac-explained": [
    "The TAC is the first eight digits of a standard IMEI. It represents the Type Allocation Code associated with the device type in the relevant allocation database.",
    "A TAC can therefore help connect an IMEI to reported manufacturer and model information. It does not by itself identify the individual handset.",
    "Our phone and TAC database uses this relationship to help return device information during an IMEI lookup.",
  ],
  "imei-checking-privacy": [
    "An IMEI is a device identifier, so it should be treated as information you do not need to publish unnecessarily. Share it only with services you trust and only when it is required.",
    "A lookup can return device-related information from the available database, but it does not automatically mean that a service can reveal private content stored on the phone.",
    "For extra privacy, avoid posting screenshots that expose your complete IMEI and remove the number from public support posts whenever it is not needed.",
  ],
};

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  return article
    ? { title: `${article.title} | IMEI.net`, description: article.excerpt }
    : { title: "News | IMEI.net" };
}

export default async function NewsArticlePage({ params }) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  const paragraphs = articleBodies[slug];

  if (!article || !paragraphs) notFound();

  return (
    <div className="modern-page-shell news-article-page">
      <Link href="/news" className="news-back-link">
        <i className="fas fa-arrow-left" /> Back to News
      </Link>

      <article className="news-article">
        <div className="news-article-header">
          <span className="section-eyebrow">{article.category}</span>
          <h1>{article.title}</h1>
          <p className="news-article-lead">{article.excerpt}</p>
          <time>{article.date}</time>
        </div>

        <img src={article.image} alt={article.title} className="news-article-image" />

        <div className="news-article-content">
          {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>

        <div className="news-article-footer">
          <Link href="/" className="primary-action">Check an IMEI <i className="fas fa-arrow-right" /></Link>
          <Link href="/faq" className="outline-action">Read FAQ <i className="fas fa-circle-question" /></Link>
        </div>
      </article>
    </div>
  );
}
