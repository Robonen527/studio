"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
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

type AddInsightButtonProps = {
  parshaSlug: string;
  isPrimary?: boolean;
};

export function AddInsightButton({ parshaSlug, isPrimary = false }: AddInsightButtonProps) {
  const { isAdmin, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading || !isAdmin) {
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
              מלא את הפרטים הבאים כדי להוסיף דבר תורה לפרשה.
            </DialogDescription>
          </DialogHeader>
          <InsightForm parshaSlug={parshaSlug} onFinished={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
