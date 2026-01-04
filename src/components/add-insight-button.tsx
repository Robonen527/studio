
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { InsightForm } from "./insight-form";
import { useUser } from "@/firebase";
import type { Parsha } from "@/lib/types";

type AddInsightButtonProps = {
  parsha: Parsha;
  isPrimary?: boolean;
};

export function AddInsightButton({ parsha, isPrimary = false }: AddInsightButtonProps) {
  const { user, isUserLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  
  // In this app, any logged-in user is an admin
  const isAdmin = !!user;

  if (isUserLoading || !isAdmin) {
    return null;
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant={isPrimary ? "default" : "outline"} size={isPrimary ? "lg" : "sm"}>
        <PlusCircle className="ml-2 h-4 w-4" />
        הוסף דבר תורה
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">הוספת דבר תורה חדש</DialogTitle>
            <DialogDescription>
              מלא את הפרטים הבאים כדי להוסיף דבר תורה לפרשת {parsha.name}.
            </DialogDescription>
          </DialogHeader>
          <InsightForm parshaSlug={parsha.id} parshaName={parsha.name} onFinished={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
