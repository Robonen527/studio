"use client";

import { useState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';

export function DateDisplay() {
  const [gregorianDate, setGregorianDate] = useState('');
  const [hebrewDate, setHebrewDate] = useState('');

  useEffect(() => {
    const now = new Date();
    setGregorianDate(now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    
    // Using Intl for Hebrew calendar which is safe for client-side rendering
    try {
        const hebrewDateString = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(now);
        setHebrewDate(hebrewDateString);
    } catch (e) {
        console.error("Could not format Hebrew date:", e);
        setHebrewDate("טוען תאריך עברי...");
    }

  }, []);

  if (!gregorianDate || !hebrewDate) {
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
            <CalendarDays className="h-4 w-4" />
            <div className="h-4 bg-muted rounded w-40"></div>
        </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <CalendarDays className="h-4 w-4" />
      <span>{gregorianDate}</span>
      <span className="opacity-50">|</span>
      <span className="font-medium">{hebrewDate}</span>
    </div>
  );
}
