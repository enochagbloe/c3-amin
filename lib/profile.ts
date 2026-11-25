import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { UnauthorizedError } from "@/lib/http.error";
import { z } from "zod";
export const profileFields = {
  id: true,
  name: true,
  username: true,
  email: true,
  phone: true,
  bio: true,
};
export async function personalProfile() {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: profileFields,
  });
}
export async function updatePersonalProfile(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  const data = z
    .object({
      name: z.string().trim().min(1).max(100),
      phone: z.string().trim().max(30),
      bio: z.string().trim().max(1000),
    })
    .strict()
    .parse(input);
  return prisma.user.update({
    where: { id: session.user.id },
    data,
    select: profileFields,
  });
}
