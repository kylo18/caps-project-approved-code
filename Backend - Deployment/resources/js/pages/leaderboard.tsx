import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Trophy, Users, BookOpen, User as UserIcon, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface LeaderboardEntry {
    rank: number;
    student_id: number;
    name: string;
    score: number;
}

interface MyRank {
    rank: number | null;
    score: number | null;
    total_candidates: number;
    message?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Leaderboard',
        href: '/leaderboard',
    },
];

type Scope = 'global' | 'exam' | 'class';

export default function Leaderboard() {
    const [scope, setScope] = useState<Scope>('global');
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [myRank, setMyRank] = useState<MyRank | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaderboard = useCallback(async () => {
        try {
            const [lbRes, meRes] = await Promise.all([
                fetch(`/api/leaderboard?scope=${scope}&limit=10`),
                fetch(`/api/leaderboard/me?scope=${scope}`)
            ]);

            if (!lbRes.ok || !meRes.ok) throw new Error('Failed to fetch leaderboard data');

            const lbData = await lbRes.json();
            const meData = await meRes.json();

            setData(lbData.data);
            setMyRank(meData);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Could not load leaderboard. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [scope]);

    useEffect(() => {
        setLoading(true);
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    // Polling with jitter
    useEffect(() => {
        const baseInterval = 30000;
        const jitter = Math.random() * 5000;
        
        const interval = setInterval(() => {
            fetchLeaderboard();
        }, baseInterval + jitter);

        return () => clearInterval(interval);
    }, [fetchLeaderboard]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leaderboard" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">System Leaderboard</h1>
                        <p className="text-muted-foreground text-sm">Real-time rankings based on best exam scores.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Select value={scope} onValueChange={(value) => setScope(value as Scope)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select Scope" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="global">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Global
                                    </div>
                                </SelectItem>
                                <SelectItem value="exam">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        By Exam
                                    </div>
                                </SelectItem>
                                <SelectItem value="class">
                                    <div className="flex items-center gap-2">
                                        <LayoutGrid className="h-4 w-4" />
                                        By Class
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-12">
                    {/* Top list */}
                    <Card className="md:col-span-8">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="text-yellow-500 h-5 w-5" />
                                Top Performers
                            </CardTitle>
                            <CardDescription>
                                Ranking of the top students for {scope} scope.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading && data.length === 0 ? (
                                <div className="space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} className="h-12 w-full" />
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="py-10 text-center text-red-500">{error}</div>
                            ) : data.length === 0 ? (
                                <div className="py-10 text-center text-muted-foreground">No data available yet.</div>
                            ) : (
                                <div className="relative w-full overflow-auto">
                                    <table className="w-full caption-bottom text-sm">
                                        <thead className="[&_tr]:border-b">
                                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[80px]">Rank</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Student</th>
                                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Best Score</th>
                                            </tr>
                                        </thead>
                                        <tbody className="[&_tr:last-child]:border-0">
                                            {data.map((entry) => (
                                                <tr key={entry.student_id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle">
                                                        {entry.rank === 1 ? (
                                                            <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">#1</Badge>
                                                        ) : entry.rank === 2 ? (
                                                            <Badge variant="default" className="bg-slate-400 hover:bg-slate-500">#2</Badge>
                                                        ) : entry.rank === 3 ? (
                                                            <Badge variant="default" className="bg-amber-600 hover:bg-amber-700">#3</Badge>
                                                        ) : (
                                                            <span className="font-semibold px-2">#{entry.rank}</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 align-middle font-medium">{entry.name}</td>
                                                    <td className="p-4 align-middle text-right">
                                                        <span className="text-lg font-bold text-primary">{entry.score}%</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Current User Card */}
                    <Card className="md:col-span-4 h-fit">
                        <CardHeader className="pb-3 text-white bg-primary rounded-t-lg">
                            <CardTitle className="flex items-center gap-2">
                                <UserIcon className="h-5 w-5" />
                                Your Standing
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {loading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : myRank && myRank.rank ? (
                                <div className="flex flex-col gap-6">
                                    <div className="text-center">
                                        <div className="text-4xl font-extrabold text-primary">#{myRank.rank}</div>
                                        <div className="text-sm text-muted-foreground uppercase tracking-widest mt-1">Current Rank</div>
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div>
                                            <div className="text-2xl font-bold">{myRank.score}%</div>
                                            <div className="text-xs text-muted-foreground">Best Score</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold">{myRank.total_candidates}</div>
                                            <div className="text-xs text-muted-foreground">Total Students</div>
                                        </div>
                                    </div>

                                    {myRank.rank <= 3 && (
                                        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-md text-yellow-700 dark:text-yellow-400 text-sm text-center font-medium">
                                            Amazing! You are on the podium! 🏆
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-muted-foreground">
                                    <Trophy className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                    <p>No rankings yet.</p>
                                    <p className="text-xs">Complete an exam to see your standing!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

const LayoutGrid = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
);
