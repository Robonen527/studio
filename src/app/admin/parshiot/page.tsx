
'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, writeBatch, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import type { Chumash, Parsha } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { revalidateInsightPaths } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Database } from 'lucide-react';
import { getStaticParshiotData } from '@/lib/static-data';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Helper to create a URL-friendly slug
const createSlug = (name: string) => {
    // Basic transliteration for Hebrew characters
    const hebrewMap: { [key: string]: string } = {
        'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z', 'ח': 'h',
        'ט': 't', 'י': 'y', 'כ': 'k', 'ל': 'l', 'מ': 'm', 'נ': 'n', 'ס': 's', 'ע': 'a',
        'פ': 'p', 'צ': 'ts', 'ק': 'k', 'ר': 'r', 'ש': 'sh', 'ת': 't',
        'ך': 'k', 'ם': 'm', 'ן': 'n', 'ף': 'p', 'ץ': 'ts'
    };

    let slug = name.trim().toLowerCase();
    slug = slug.split('').map(char => hebrewMap[char] || char).join('');
    return slug.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};


function SeedButton() {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const firestore = useFirestore();
    
    const handleSeed = () => {
        if (!firestore) {
            toast({ variant: "destructive", title: "שגיאה", description: "שירות מסד הנתונים אינו זמין." });
            return;
        }

        startTransition(async () => {
            const batch = writeBatch(firestore);
            const { chumashim, parshiot } = getStaticParshiotData();
            
            chumashim.forEach(chumash => {
                const chumashRef = doc(firestore, 'chumashim', chumash.id);
                batch.set(chumashRef, chumash);
            });

            parshiot.forEach(parsha => {
                const parshaRef = doc(firestore, 'parshiot', parsha.id);
                batch.set(parshaRef, parsha);
            });
            
            batch.commit().then(async () => {
                await revalidateInsightPaths();
                toast({
                    title: "הצלחה",
                    description: "מסד הנתונים אותחל בהצלחה. רענן את הדף כדי לראות את הנתונים."
                });
                window.location.reload();
            }).catch((e: any) => {
                console.error(e);
                const permissionError = new FirestorePermissionError({
                    path: 'batch operation',
                    operation: 'write',
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({
                    variant: "destructive",
                    title: "שגיאה",
                    description: "אירעה שגיאה בעת אתחול מסד הנתונים."
                })
            });
        });
    }

    return (
        <Button variant="secondary" onClick={handleSeed} disabled={isPending}>
            {isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Database className="ml-2 h-4 w-4" />}
            אתחול וזריעת נתונים
        </Button>
    )
}


function EditCategoryDialog({ category, totalCategories, onFinished }: { category?: Chumash, totalCategories: number, onFinished: () => void }) {
    const [name, setName] = useState(category?.name || '');
    const [isPending, startTransition] = useTransition();
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleSubmit = () => {
        if (!firestore) return;
        if (!name) {
            toast({ variant: 'destructive', title: 'שם הקטגוריה חסר' });
            return;
        }
        
        const isEditing = !!category;
        const id = isEditing ? category.id : createSlug(name);
        
        if (!id) {
            toast({ variant: 'destructive', title: 'מזהה קטגוריה חסר' });
            return;
        }

        startTransition(async () => {
            const docRef = doc(firestore, 'chumashim', id);
            
            const dataToSave: Omit<Chumash, 'id'> = {
                name,
                order: isEditing && typeof category.order === 'number' ? category.order : totalCategories + 1
            };

            setDoc(docRef, dataToSave, { merge: true }).then(async () => {
                await revalidateInsightPaths();
                toast({ title: 'הקטגוריה נשמרה בהצלחה' });
                onFinished();
            }).catch((e: any) => {
                 errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'write',
                        requestResourceData: { name },
                    })
                );
                toast({ variant: 'destructive', title: 'שגיאה בשמירת הקטגוריה' });
            });
        });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{category ? 'עריכת קטגוריה' : 'הוספת קטגוריה חדשה'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="chumash-name" className="text-right">שם</Label>
                    <Input id="chumash-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onFinished}>ביטול</Button>
                <Button onClick={handleSubmit} disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    שמור
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}

function EditParshaDialog({ parsha, chumashId, onFinished }: { parsha?: Parsha, chumashId: string, onFinished: () => void }) {
    const [name, setName] = useState(parsha?.name || '');
    const [isPending, startTransition] = useTransition();
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleSubmit = () => {
        if (!firestore) return;
        if (!name) {
            toast({ variant: 'destructive', title: 'שם הפרשה חסר' });
            return;
        }

        const id = parsha ? parsha.id : createSlug(name);
        if (!id) {
            toast({ variant: 'destructive', title: 'מזהה פרשה חסר' });
            return;
        }


        startTransition(async () => {
            const docRef = doc(firestore, 'parshiot', id);
            setDoc(docRef, { name, chumashId, id }, { merge: true }).then(async () => {
                await revalidateInsightPaths(id);
                toast({ title: 'הפרשה נשמרה בהצלחה' });
                onFinished();
            }).catch((e: any) => {
                errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'write',
                        requestResourceData: { name, chumashId },
                    })
                );
                toast({ variant: 'destructive', title: 'שגיאה בשמירת הפרשה' });
            });
        });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{parsha ? 'עריכת פרשה' : 'הוספת פרשה חדשה'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="parsha-name" className="text-right">שם</Label>
                    <Input id="parsha-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onFinished}>ביטול</Button>
                <Button onClick={handleSubmit} disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    שמור
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}


export default function AdminParshiotPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const [dialog, setDialog] = useState<{ type: 'category' | 'parsha'; payload?: any } | null>(null);

    const chumashimQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'chumashim'), orderBy('order')) : null, [firestore]);
    const { data: categories, isLoading: isLoadingCategories } = useCollection<Chumash>(chumashimQuery);

    const parshiotQuery = useMemoFirebase(() => firestore ? collection(firestore, 'parshiot') : null, [firestore]);
    const { data: parshiot, isLoading: isLoadingParshiot } = useCollection<Parsha>(parshiotQuery);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    const parshiotByCategoryId = useMemo(() => {
        if (!parshiot) return {};
        return parshiot.reduce((acc, parsha) => {
            if (!acc[parsha.chumashId]) {
                acc[parsha.chumashId] = [];
            }
            acc[parsha.chumashId].push(parsha);
            return acc;
        }, {} as Record<string, Parsha[]>);
    }, [parshiot]);

    const handleDeleteCategory = async (categoryId: string) => {
        if (!firestore) return;
        if (parshiotByCategoryId[categoryId]?.length > 0) {
            alert('לא ניתן למחוק קטגוריה שיש בה פרשות.');
            return;
        }
        if (window.confirm('האם אתה בטוח שברצונך למחוק את הקטגוריה?')) {
            const docRef = doc(firestore, 'chumashim', categoryId);
            deleteDoc(docRef).then(async () => {
                await revalidateInsightPaths();
            }).catch((e: any) => {
                 errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'delete',
                    })
                );
                alert("אין לך הרשאה למחוק את הקטגוריה.");
            });
        }
    };

    const handleDeleteParsha = async (parshaId: string) => {
        if (!firestore) return;
        if (window.confirm('האם אתה בטוח שברצונך למחוק את הפרשה? פעולה זו תמחק גם את כל דברי התורה המשויכים אליה.')) {
            try {
                // First, delete all insights in the subcollection
                const insightsRef = collection(firestore, `parshiot/${parshaId}/torahInsights`);
                const insightsSnapshot = await getDocs(insightsRef);
                const batch = writeBatch(firestore);
                insightsSnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();

                // Then, delete the parsha document itself
                const docRef = doc(firestore, 'parshiot', parshaId);
                await deleteDoc(docRef);

                // Revalidate paths
                await revalidateInsightPaths(parshaId);
            } catch(e: any) {
                 const docRef = doc(firestore, 'parshiot', parshaId);
                 errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'delete',
                    })
                );
                 alert("אין לך הרשאה למחוק את הפרשה או את דברי התורה המשויכים אליה.");
            }
        }
    };
    
    const isLoading = isUserLoading || isLoadingCategories || isLoadingParshiot;
    const isDataEmpty = !isLoading && (!categories || categories.length === 0);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="flex justify-between items-center mb-12">
                    <Skeleton className="h-12 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="space-y-8">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
                            <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="font-headline text-4xl md:text-5xl text-primary">ניהול פרשות וקטגוריות</h1>
                        <p className="mt-2 text-md text-muted-foreground">ערוך, הוסף ומחק קטגוריות ופרשות במערכת.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isDataEmpty && <SeedButton />}
                        <Button onClick={() => setDialog({ type: 'category' })}>
                            <Plus className="ml-2" />
                            הוסף קטגוריה
                        </Button>
                    </div>
                </div>

                <div className="space-y-8">
                    {categories?.map(category => (
                        <Card key={category.id}>
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle className="font-headline text-3xl text-primary/90">{category.name}</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'category', payload: category })}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteCategory(category.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setDialog({type: 'parsha', payload: {chumashId: category.id}})}>
                                        <Plus className="ml-2 h-4 w-4" />
                                        הוסף פרשה
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {(parshiotByCategoryId[category.id] || []).map(parsha => (
                                        <div key={parsha.id} className="group relative rounded-md border p-3 flex justify-between items-center">
                                            <span className="font-medium">{parsha.name}</span>
                                            <div className="absolute top-1 left-1 flex opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDialog({ type: 'parsha', payload: { parsha, chumashId: category.id }})}>
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDeleteParsha(parsha.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    { (parshiotByCategoryId[category.id] || []).length === 0 && (
                                        <p className="text-sm text-muted-foreground col-span-full">אין פרשות לקטגוריה זו.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <Dialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
                {dialog?.type === 'category' && <EditCategoryDialog category={dialog.payload} totalCategories={categories?.length || 0} onFinished={() => setDialog(null)} />}
                {dialog?.type === 'parsha' && <EditParshaDialog parsha={dialog.payload?.parsha} chumashId={dialog.payload.chumashId} onFinished={() => setDialog(null)} />}
            </Dialog>
        </>
    );
}
