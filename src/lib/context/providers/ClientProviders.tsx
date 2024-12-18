"use client";

import Navbar from "../../../components/nav/Navbar";

interface ClientProvidersProps {
  children: React.ReactNode;
}

// use this to wrap the app with non SSR components
export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
