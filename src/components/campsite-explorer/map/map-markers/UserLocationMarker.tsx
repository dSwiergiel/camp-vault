export default function UserLocationMarker() {
  return (
    <div className="relative">
      <div className="absolute w-6 h-6 bg-red-500 rounded-full animate-ping opacity-75" />
      <div
        className="absolute w-4 h-4 bg-red-500 rounded-full"
        style={{ left: "4px", top: "4px" }}
      />
    </div>
  );
}
