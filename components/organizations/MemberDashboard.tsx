import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MemberDashboard({ organizationId, canReview }: { organizationId: string; canReview: boolean }) {
  const base = `/org/${organizationId}/budget-requests`;
  return <main className="space-y-6 p-3 sm:p-6"><div><h1 className="text-3xl font-bold">Dashboard</h1><p className="mt-2 text-muted-foreground">Request church budgets and follow your approvals.</p></div>
    <div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>Request a budget</CardTitle><CardDescription>Submit the amount and purpose for your church activity.</CardDescription></CardHeader><CardContent><Button asChild><Link href={`${base}/new`}>Request budget</Link></Button></CardContent></Card>
      <Card><CardHeader><CardTitle>My request history</CardTitle><CardDescription>See your requests and whether they are pending, approved or rejected.</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><Link href={base}>View my requests</Link></Button></CardContent></Card>
      {canReview && <Card><CardHeader><CardTitle>Assigned approvals</CardTitle><CardDescription>Review only budgets assigned to you.</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><Link href={base}>Review assigned requests</Link></Button></CardContent></Card>}
    </div>
  </main>;
}
