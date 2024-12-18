"use client";

import { Tent, Menu, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/nav/ThemeToggle";
export default function Navbar() {
  const LINKS = [
    { label: "Explore", href: "/explore" },
    { label: "Community", href: "/community" },
  ];
  return (
    <nav className="border-b border-input bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Tent className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-foreground">
                CampVault
              </span>
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {LINKS.map((link) => (
                  <Link
                    href={link.href}
                    key={link.href}
                    className="text-sm font-medium hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center ">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex ml-2"
            >
              <User className="h-5 w-5" />
              <span className="sr-only">Profile</span>
            </Button>
            <div className="flex md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetHeader className="mb-4">
                    <SheetTitle>
                      <div className="flex items-center">
                        <Tent className="h-6 w-6 text-primary" />
                        <span className="ml-2 text-lg font-bold">
                          CampVault
                        </span>
                      </div>
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col space-y-4">
                    {LINKS.map((link) => (
                      <Link
                        href={link.href}
                        key={link.href}
                        className="flex items-center text-sm font-medium transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
