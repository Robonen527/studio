
"use client";

import { useState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import { getCurrentParsha as getParshaByDate, getParshaBySlug } from '@/lib/actions'; 
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Parsha } from '@/lib/types';

export function DateDisplay() {
  const [gregorianDate, setGregorianDate] = useState('');
  const [hebrewDate, setHebrewDate] = useState('');
  const [parshaName, setParshaName] = useState('טוען פרשה...');

  const firestore = useFirestore();

  // 1. Fetch the manually set parsha from Firestore
  const settingsDocRef = useMemoFirebase(() => doc(firestore, 'settings/currentParsha'), [firestore]);
  const { data: manualParshaSetting, isLoading: isLoadingManualParsha } = useDoc<{ slug: string }>(settingsDocRef);

  // 2. Fetch the date-based parsha as a fallback
  const [dateBasedParsha, setDateBasedParsha] = useState<Parsha | null>(null);
  useEffect(() => {
    async function fetchParshaByDate() {
      const parsha = await getParshaByDate();
      setDateBasedParsha(parsha);
    }
    fetchParshaByDate();
  }, []);

  // 3. Determine the definitive current parsha and set dates
  useEffect(() => {
    async function determineParsha() {
      if (isLoadingManualParsha) return;

      let finalParsha: Parsha | null = null;
      if (manualParshaSetting?.slug) {
        const parsha = await getParshaBySlug(manualParshaSetting.slug);
        finalParsha = parsha;
      } else {
        finalParsha = dateBasedParsha;
      }
      
      if (finalParsha) {
        setParshaName(`פרשת ${finalParsha.name}`);
      }
    }
    determineParsha();
  }, [manualParshaSetting, dateBasedParsha, isLoadingManualParsha]);


  useEffect(() => {
    const now = new Date();
    setGregorianDate(now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }));

    try {
      const hebrewDateString = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(now);

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
    

  }, []);

  const isLoading = !gregorianDate || !hebrewDate || parshaName === 'טוען פרשה...';

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
        <CalendarDays className="h-4 w-4" />
        <div className="h-4 bg-muted rounded w-48"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-xs md:text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <CalendarDays className="h-4 w-4" />
        <span>{gregorianDate}</span>
      </div>
      <span className="opacity-50 hidden sm:inline">|</span>
      <span className="font-medium">{hebrewDate}</span>
      <span className="opacity-50 hidden sm:inline">|</span>
      <span className="font-medium text-primary/90">{parshaName}</span>
    </div>
  );
}
