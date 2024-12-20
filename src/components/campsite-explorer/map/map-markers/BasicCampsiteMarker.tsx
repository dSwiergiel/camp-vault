import Image from "next/image";

export default function BasicCampsiteMarker() {
  return (
    <div className="relative">
      <Image
        src="/campsite-marker.svg"
        alt="Campsite Marker"
        className="w-7 h-7"
        width={5}
        height={5}
      />
    </div>
  );
}
