import Link from "next/link";

const articles = [
  {
    slug: "what-is-an-imei-number",
    title: "What Is an IMEI Number?",
    excerpt: "Learn what the 15-digit International Mobile Equipment Identity means and how it identifies a mobile device.",
    category: "IMEI GUIDE",
    date: "August 10, 2026",
    image: "/images/imei-news-1.webp",
  },
  {
    slug: "check-imei-before-buying-used-phone",
    title: "Check IMEI Before Buying a Used Phone",
    excerpt: "A quick IMEI check can help you make a more informed decision before purchasing a second-hand device.",
    category: "BUYING GUIDE",
    date: "August 8, 2026",
    image: "/images/imei-news-2.webp",
  },
  {
    slug: "esim-eid-and-imei-explained",
    title: "eSIM, EID and IMEI Explained",
    excerpt: "Understand the identifiers used by modern phones and how they relate to mobile connectivity.",
    category: "TECH GUIDE",
    date: "August 6, 2026",
    image: "/images/imei-news-3.webp",
  },
  {
    slug: "how-to-find-your-imei",
    title: "How to Find Your Phone's IMEI",
    excerpt: "Several simple ways to find the IMEI on Android and iPhone devices, even when you cannot open the phone settings.",
    category: "HOW TO",
    date: "August 4, 2026",
    image: "/images/imei-news-1.webp",
  },
  {
    slug: "imei-tac-explained",
    title: "IMEI and TAC: What the First 8 Digits Tell You",
    excerpt: "The TAC is the part of an IMEI used to identify the device type and manufacturer information available in the database.",
    category: "DATABASE",
    date: "August 2, 2026",
    image: "/images/imei-news-2.webp",
  },
  {
    slug: "imei-checking-privacy",
    title: "IMEI Checking and Privacy",
    excerpt: "What an IMEI lookup can reveal, what it cannot reveal, and why you should avoid sharing sensitive device information publicly.",
    category: "PRIVACY",
    date: "July 30, 2026",
    image: "/images/imei-news-3.webp",
  },
];

export { articles };

export default function NewsPage() {
  return (
    <div className="modern-page-shell news-page">
      <div className="news-page-hero">
        <span className="section-eyebrow">IMEI NEWS</span>
        <h1>Guides, updates &amp; device insights</h1>
        <p>
          Practical IMEI guides, phone-checking tips and simple explanations
          for the identifiers behind modern mobile devices.
        </p>
      </div>

      <div className="news-page-toolbar">
        <span>{articles.length} articles</span>
        <Link href="/" className="outline-action">
          Check an IMEI <i className="fas fa-arrow-right" />
        </Link>
      </div>

      <div className="news-page-grid">
        {articles.map((article) => (
          <article className="news-page-card" key={article.slug}>
            <Link href={`/news/${article.slug}`} className="news-page-image-wrap">
              <img src={article.image} alt={article.title} className="news-page-image" />
            </Link>
            <div className="news-page-card-body">
              <div className="news-page-meta">
                <span>{article.category}</span>
                <time>{article.date}</time>
              </div>
              <h2>{article.title}</h2>
              <p>{article.excerpt}</p>
              <Link href={`/news/${article.slug}`} className="news-page-read">
                Read article <i className="fas fa-arrow-right" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="news-page-bottom">
        <span>More guides will be added as the project grows.</span>
        <Link href="/faq" className="primary-action">
          Visit FAQ <i className="fas fa-circle-question" />
        </Link>
      </div>
    </div>
  );
}
