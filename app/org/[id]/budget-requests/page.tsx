import RequestsList from "@/components/budget-requests/RequestsList";
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ scope?: string }> }) { return <RequestsList organizationId={(await params).id} initialScope={(await searchParams).scope} />; }
