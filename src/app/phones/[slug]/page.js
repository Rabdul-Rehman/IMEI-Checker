import Link from "next/link";
import { notFound } from "next/navigation";
import { popularDevices } from "../../data/devices";
import DevicePhoto from "../../components/DevicePhoto";

export function generateStaticParams() {
  return popularDevices.map((device) => ({ slug: device.slug }));
}

export default function PhoneDetailPage({ params }) {
  const device = popularDevices.find((d) => d.slug === params.slug);

  if (!device) {
    notFound();
  }

  return (
    <div className="container-fluid phone-detail-page">
      {/* Breadcrumb */}
      <div className="phone-breadcrumb">
        <Link href="/">Home</Link> / <Link href="/">Phone Database</Link> /{" "}
        <span className="active">{device.name}</span>
      </div>
      {/* Top section: image + info */}
      <div className="phone-detail-top">
        <div className="phone-detail-image">
          <DevicePhoto src={device.image} alt={device.name} />
        </div>

        <div className="phone-detail-info">
          <div className="device-brand">{device.brand}</div>
          <h1 className="phone-detail-title">{device.name}</h1>

          <div className="phone-detail-tags">
            <span className="phone-tag">Model: {device.model}</span>
            <span className="phone-tag">{device.releaseDate}</span>
          </div>

          <Link
            href={`/?imei=${device.slug}`}
            className="btn cta-btn phone-check-btn"
          >
            Check IMEI for this device
          </Link>
        </div>
      </div>

      {/* Key Specifications */}
      <div className="phone-detail-specs">
        <h2 className="mb-4">Key Specifications</h2>
        <div className="row gy-3">
          {device.keySpecs.map((spec) => (
            <div className="col-6 col-md-3" key={spec.label}>
              <div className="phone-spec-card">
                <div className="phone-spec-label">{spec.label}</div>
                <div className="phone-spec-value">{spec.value}</div>
                <div className="phone-spec-sub">{spec.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
