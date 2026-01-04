
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import type { Chumash, Parsha } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { revalidateInsightPaths } from '@/lib/actions';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

// Helper to create a URL-friendly slug
const createSlug = (name: string) => {
    return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

function EditChumashDialog({ chumash, onFinished }: { chumash?: Chumash, onFinished: () => void }) {
    const [name, setName] = useState(chumash?.name || '');
    const [order, setOrder] = useState(chumash?.order || 0);
    const [isPending, startTransition] = useTransition();
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleSubmit = () => {
        if (!name) {
            toast({ variant: 'destructive', title: 'שם החומש חסר' });
            return;
        }
        startTransition(async () => {
            try {
                const id = chumash ? chumash.id : createSlug(name);
                const docRef = doc(firestore, 'chumashim', id);
                await setDocumentNonBlocking(docRef, { name, order }, { merge: true });
                await revalidateInsightPaths();
                toast({ title: 'החומש נשמר בהצלחה' });
                onFinished();
            } catch (e) {
                toast({ variant: 'destructive', title: 'שגיאה בשמירת החומש' });
            }
        });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{chumash ? 'עריכת חומש' : 'הוספת חומש חדש'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="chumash-name" className="text-right">שם</Label>
                    <Input id="chumash-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="chumash-order" className="text-right">סדר</Label>
                    <Input id="chumash-order" type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className="col-span-3" />
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
        if (!name) {
            toast({ variant: 'destructive', title: 'שם הפרשה חסר' });
            return;
        }
        startTransition(async () => {
            try {
                const id = parsha ? parsha.id : createSlug(name);
                const docRef = doc(firestore, 'parshiot', id);
                await setDocumentNonBlocking(docRef, { name, chumashId }, { merge: true });
                await revalidateInsightPaths(id);
                toast({ title: 'הפרשה נשמרה בהצלחה' });
                onFinished();
            } catch (e) {
                toast({ variant: 'destructive', title: 'שגיאה בשמירת הפרשה' });
            }
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
    const [dialog, setDialog] = useState<{ type: 'chumash' | 'parsha'; payload?: any } | null>(null);

    const chumashimQuery = useMemoFirebase(() => query(collection(firestore, 'chumashim'), orderBy('order')), [firestore]);
    const { data: chumashim, isLoading: isLoadingChumashim } = useCollection<Chumash>(chumashimQuery);

    const parshiotQuery = useMemoFirebase(() => collection(firestore, 'parshiot'), [firestore]);
    const { data: parshiot, isLoading: isLoadingParshiot } = useCollection<Parsha>(parshiotQuery);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    const parshiotByChumashId = useMemo(() => {
        if (!parshiot) return {};
        return parshiot.reduce((acc, parsha) => {
            if (!acc[parsha.chumashId]) {
                acc[parsha.chumashId] = [];
            }
            acc[parsha.chumashId].push(parsha);
            return acc;
        }, {} as Record<string, Parsha[]>);
    }, [parshiot]);

    const handleDeleteChumash = (chumashId: string) => {
        if (parshiotByChumashId[chumashId]?.length > 0) {
            alert('לא ניתן למחוק חומש שיש בו פרשות.');
            return;
        }
        if (window.confirm('האם אתה בטוח שברצונך למחוק את החומש?')) {
            const docRef = doc(firestore, 'chumashim', chumashId);
            deleteDocumentNonBlocking(docRef);
            revalidateInsightPaths();
        }
    };

    const handleDeleteParsha = (parshaId: string) => {
        if (window.confirm('האם אתה בטוח שברצונך למחוק את הפרשה? פעולה זו תמחק גם את כל דברי התורה המשויכים אליה.')) {
            const docRef = doc(firestore, 'parshiot', parshaId);
            deleteDocumentNonBlocking(docRef);
            revalidateInsightPaths(parshaId);
        }
    };
    
    const isLoading = isUserLoading || isLoadingChumashim || isLoadingParshiot;

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
                        <h1 className="font-headline text-4xl md:text-5xl text-primary">ניהול פרשות וחומשים</h1>
                        <p className="mt-2 text-md text-muted-foreground">ערוך, הוסף ומחק חומשים ופרשות במערכת.</p>
                    </div>
                    <Button onClick={() => setDialog({ type: 'chumash' })}>
                        <Plus className="ml-2" />
                        הוסף חומש
                    </Button>
                </div>

                <div className="space-y-8">
                    {chumashim?.map(chumash => (
                        <Card key={chumash.id}>
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle className="font-headline text-3xl text-primary/90">{chumash.name}</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => setDialog({ type: 'chumash', payload: chumash })}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteChumash(chumash.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setDialog({type: 'parsha', payload: {chumashId: chumash.id}})}>
                                        <Plus className="ml-2 h-4 w-4" />
                                        הוסף פרשה
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {(parshiotByChumashId[chumash.id] || []).map(parsha => (
                                        <div key={parsha.id} className="group relative rounded-md border p-3 flex justify-between items-center">
                                            <span className="font-medium">{parsha.name}</span>
                                            <div className="absolute top-1 left-1 flex opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDialog({ type: 'parsha', payload: { parsha, chumashId: chumash.id }})}>
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDeleteParsha(parsha.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    { (parshiotByChumashId[chumash.id] || []).length === 0 && (
                                        <p className="text-sm text-muted-foreground col-span-full">אין פרשות לחומש זה.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <Dialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
                {dialog?.type === 'chumash' && <EditChumashDialog chumash={dialog.payload} onFinished={() => setDialog(null)} />}
                {dialog?.type === 'parsha' && <EditParshaDialog parsha={dialog.payload?.parsha} chumashId={dialog.payload.chumashId} onFinished={() => setDialog(null)} />}
            </Dialog>
        </>
    );
}
