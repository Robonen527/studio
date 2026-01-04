
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Insight, Parsha } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useFirestore, addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { revalidateInsightPaths } from "@/lib/actions";


const formSchema = z.object({
  title: z.string().min(2, { message: "הכותרת חייבת להכיל לפחות 2 תווים." }),
  author: z.string().min(2, { message: "שם המחבר חייב להכיל לפחות 2 תווים." }),
  content: z.string().min(10, { message: "התוכן חייב להכיל לפחות 10 תווים." }),
});

type InsightFormProps = {
  parshaSlug: string;
  parshaName?: string;
  insightToEdit?: Insight;
  onFinished: () => void;
};

export function InsightForm({ parshaSlug, insightToEdit, onFinished, parshaName }: InsightFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: insightToEdit
    ? { // Values for editing
        title: insightToEdit.title,
        author: insightToEdit.author,
        content: insightToEdit.content,
      }
    : { // Default values for adding
        title: parshaName || '',
        author: 'מאיר רונן',
        content: '',
      },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        if (insightToEdit) {
          // Editing existing insight
          const docRef = doc(firestore, `parshiot/${parshaSlug}/torahInsights`, insightToEdit.id);
          const dataToUpdate = { ...values };
          setDocumentNonBlocking(docRef, dataToUpdate, { merge: true });
          toast({
            title: "הצלחה!",
            description: "דבר התורה עודכן בהצלחה.",
          });
        } else {
          // Adding new insight
          const collectionRef = collection(firestore, `parshiot/${parshaSlug}/torahInsights`);
          const dataToAdd = {
            ...values,
            parshaSlug: parshaSlug,
            createdAt: new Date().toISOString(),
          };
          addDocumentNonBlocking(collectionRef, dataToAdd);
          toast({
            title: "הצלחה!",
            description: "דבר התורה נוסף בהצלחה.",
          });
        }

        await revalidateInsightPaths(parshaSlug);
        onFinished();
        
      } catch (error) {
        console.error("Error saving insight:", error);
        toast({
          variant: "destructive",
          title: "שגיאה",
          description: "אירעה שגיאה בשמירת דבר התורה.",
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>כותרת</FormLabel>
              <FormControl>
                <Input placeholder="למשל: אור וחושך בבריאה" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="author"
          render={({ field }) => (
            <FormItem>
              <FormLabel>שם המחבר</FormLabel>
              <FormControl>
                <Input placeholder="למשל: הרב יונתן זקס" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>תוכן דבר התורה</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="כתוב כאן את דבר התורה..."
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {insightToEdit ? "עדכון דבר תורה" : "הוספת דבר תורה"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
