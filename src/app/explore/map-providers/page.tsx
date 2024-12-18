import Link from "next/link";

export default function MapCredits() {
  const credits = [
    {
      name: "Leaflet",
      url: "https://leafletjs.com",
      description: "Interactive map library",
    },
    {
      name: "OpenStreetMap",
      url: "https://www.openstreetmap.org/copyright",
      description: "Base map data and street view layers",
    },
    {
      name: "Esri",
      url: "https://www.esri.com/",
      description: "Satellite imagery and world boundaries",
    },
    {
      name: "USGS",
      url: "https://www.usgs.gov/",
      description: "Terrain and hydrological data",
    },
    {
      name: "Caltopo",
      url: "https://caltopo.com/",
      description: "Trail mapping data",
    },
    {
      name: "OpenTopoMap",
      url: "https://opentopomap.org",
      description: "Topographic mapping data",
    },
  ];

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/explore" className="text-primary hover:underline">
          ← Back to Map
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Map Data Providers</h1>

      <div className="space-y-6">
        {credits.map((credit) => (
          <div key={credit.name} className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">{credit.name}</h2>
            <p className="text-muted-foreground mb-2">{credit.description}</p>
            <a
              href={credit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Visit Provider →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
