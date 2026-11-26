import {organizationAccess} from '@/lib/organizations/access';
import FinanceDashboard from '@/components/organizations/FinanceDashboard';
import MemberDashboard from '@/components/organizations/MemberDashboard';
export default async function Page({params}:{params:Promise<{id:string}>}) {
 const {id}=await params; const access=await organizationAccess(id);
 return access.canFinance ? <FinanceDashboard/> : <MemberDashboard organizationId={id} canReview={access.canReviewBudgets}/>;
}
