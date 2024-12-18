"use client";

import { ThemeProvider } from "@/lib/context/theme/ThemeContext";
import Navbar from "../../../components/nav/Navbar";

interface ClientProvidersProps {
  children: React.ReactNode;
}
export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <>
      <ThemeProvider defaultTheme="system" storageKey="app-theme">
        <Navbar />
        {children}
      </ThemeProvider>
    </>
  );
}
