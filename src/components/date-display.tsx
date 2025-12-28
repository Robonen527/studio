"use client";

import { useState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import { getCurrentParsha } from '@/lib/actions'; // Assuming this can be used on the client

export function DateDisplay() {
  const [gregorianDate, setGregorianDate] = useState('');
  const [hebrewDate, setHebrewDate] = useState('');
  const [parsha, setParsha] = useState('');

  useEffect(() => {
    async function fetchDateAndParsha() {
      const now = new Date();
      setGregorianDate(now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }));

      // Fetch current parsha
      try {
        const currentParsha = await getCurrentParsha();
        setParsha(`פרשת ${currentParsha.name}`);
      } catch (e) {
        console.error("Could not fetch parsha:", e);
        setParsha("טוען פרשה...");
      }

      // Using Intl for Hebrew calendar
      try {
        const hebrewDateString = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(now);

        // Simple conversion for day to Hebrew letters (works for 1-10)
        // A full library like 'hebcal' would be needed for a complete solution.
        const dayNumber = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric' }).format(now);
        const dayLetter = {
            '1': 'א\'', '2': 'ב\'', '3': 'ג\'', '4': 'ד\'', '5': 'ה\'', '6': 'ו\'', '7': 'ז\'', '8': 'ח\'', '9': 'ט\'', '10': 'י\'',
            '11': 'י"א', '12': 'י"ב', '13': 'י"ג', '14': 'י"ד', '15': 'ט"ו', '16': 'ט"ז', '17': 'י"ז', '18': 'י"ח', '19': 'י"ט', '20': 'כ\'',
            '21': 'כ"א', '22': 'כ"ב', '23': 'כ"ג', '24': 'כ"ד', '25': 'כ"ה', '26': 'כ"ו', '27': 'כ"ז', '28': 'כ"ח', '29': 'כ"ט', '30': 'ל\'',
        }[dayNumber] || dayNumber;
        
        const monthAndYear = hebrewDateString.replace(dayNumber, '').trim();
        setHebrewDate(`${dayLetter} ${monthAndYear}`);

      } catch (e) {
        console.error("Could not format Hebrew date:", e);
        setHebrewDate("טוען תאריך עברי...");
      }
    }

    fetchDateAndParsha();
  }, []);

  if (!gregorianDate || !hebrewDate || !parsha) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
        <CalendarDays className="h-4 w-4" />
        <div className="h-4 bg-muted rounded w-48"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4" />
        <span>{gregorianDate}</span>
      </div>
      <span className="opacity-50 hidden sm:inline">|</span>
      <span className="font-medium">{hebrewDate}</span>
      <span className="opacity-50 hidden sm:inline">|</span>
      <span className="font-medium text-primary/90">{parsha}</span>
    </div>
  );
}
