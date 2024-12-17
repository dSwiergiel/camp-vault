import CampsiteMap from "@/components/campsite-explorer/map/CampsiteMap";
import CampsiteList from "@/components/campsite-explorer/list/CampsiteList";

export default function Explore() {
  return (
    <div>
      <CampsiteMap />
      <CampsiteList />
    </div>
  );
}
