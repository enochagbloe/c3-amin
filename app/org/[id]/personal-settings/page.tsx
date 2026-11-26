import {redirect} from 'next/navigation';
export default async function Page({params}:{params:Promise<{id:string}>}) { redirect(`/org/${(await params).id}/settings`); }
