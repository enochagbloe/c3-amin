import NextAuth from 'next-auth';
// Keep the PostgreSQL driver out of the Edge middleware bundle.
export const {auth:middleware}=NextAuth({providers:[],session:{strategy:'jwt'},trustHost:true});
export const config={matcher:['/((?!api|_next/static|_next/image|favicon.ico|public).*)']};
