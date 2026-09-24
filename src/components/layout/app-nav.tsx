"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";

export function AppNav({ items }: { items: NavItem[] }) {
  return (
    <>
      <nav className="hidden items-center gap-4 md:flex">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm font-medium text-foreground hover:text-primary"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <Sheet>
        <SheetTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "md:hidden")}
        >
          <Menu aria-hidden />
          <span className="sr-only">Open menu</span>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Camelot Scheduler</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-4">
            {items.map((item) => (
              <SheetClose
                key={item.href}
                render={<Link href={item.href} />}
                className="rounded-md px-2 py-2 text-left text-sm font-medium hover:bg-muted"
              >
                {item.label}
              </SheetClose>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
