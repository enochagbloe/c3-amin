import OrganizationSettingsPage from '@/components/organizations/OrganizationSettingsPage';
export default async function Page({searchParams}:{searchParams:Promise<{tab?:string}>}) {
 return <OrganizationSettingsPage initialTab={(await searchParams).tab??'personal'}/>;
}
