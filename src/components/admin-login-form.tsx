
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTransition, useState } from "react";
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
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "@/firebase";

const formSchema = z.object({
  username: z.string().min(1, { message: "יש להזין שם משתמש." }),
  password: z.string().min(4, { message: "הסיסמה חייבת להכיל לפחות 4 תווים." }),
});

type AdminLoginFormProps = {
  onSuccess: () => void;
};

export function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    startTransition(async () => {
      // Hardcoded check for admin user
      if (values.username.toLowerCase() === 'admin' && values.password === '1234') {
        try {
          // We still sign in to get a valid user session for Firestore rules.
          // For this demo, we use a pre-created user.
          await signInWithEmailAndPassword(auth, "admin@example.com", values.password);
          onSuccess();
        } catch (e: any) {
           // If the pre-defined admin user doesn't exist in Firebase, this will fail.
           // For the demo, we will show a more specific error.
            if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
                 setError("התחברות המנהל המוגדרת מראש נכשלה. ודא שהמשתמש admin@example.com קיים במערכת האימות של Firebase.");
            } else {
                setError("אירעה שגיאה לא צפויה באימות. נסה שוב מאוחר יותר.");
            }
        }
      } else {
        setError("שם המשתמש או הסיסמה שגויים.");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>שגיאת התחברות</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>שם משתמש</FormLabel>
              <FormControl>
                <Input placeholder="admin" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>סיסמה</FormLabel>
              <FormControl>
                <Input type="password" placeholder="הכנס סיסמה" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                התחבר
            </Button>
        </div>
      </form>
    </Form>
  );
}
