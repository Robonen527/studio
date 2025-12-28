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
import { addInsight, editInsight } from "@/lib/actions";
import type { Insight } from "@/lib/types";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(2, { message: "הכותרת חייבת להכיל לפחות 2 תווים." }),
  author: z.string().min(2, { message: "שם המחבר חייב להכיל לפחות 2 תווים." }),
  content: z.string().min(10, { message: "התוכן חייב להכיל לפחות 10 תווים." }),
});

type InsightFormProps = {
  parshaSlug: string;
  insightToEdit?: Insight;
  onFinished: () => void;
};

export function InsightForm({ parshaSlug, insightToEdit, onFinished }: InsightFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: insightToEdit?.title || "",
      author: insightToEdit?.author || "",
      content: insightToEdit?.content || "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
        const result = insightToEdit 
            ? await editInsight(insightToEdit.id, values)
            : await addInsight({ ...values, parshaSlug });
      
        if (result.success) {
            toast({
                title: "הצלחה!",
                description: result.message,
            });
            onFinished();
        } else {
            toast({
                variant: "destructive",
                title: "שגיאה",
                description: result.message,
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
