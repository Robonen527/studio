
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { InsightForm } from "./insight-form";
import type { Insight } from "@/lib/types";
import { useUser } from "@/firebase";

type EditInsightButtonProps = {
  insight: Insight;
};

export function EditInsightButton({ insight }: EditInsightButtonProps) {
  const { user, isUserLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = !!user;

  if (isUserLoading || !isAdmin) {
    return null;
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="ghost" size="icon">
        <Pencil className="h-4 w-4" />
        <span className="sr-only">ערוך דבר תורה</span>
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">עריכת דבר תורה</DialogTitle>
            <DialogDescription>
              שנה את הפרטים ועדכן את דבר התורה.
            </DialogDescription>
          </DialogHeader>
          <InsightForm
            parshaSlug={insight.parshaSlug}
            insightToEdit={insight}
            onFinished={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
