import { prisma } from '@/lib/prisma'
import PeopleClientPage from "./PeopleClientPage";
import { Role } from '@/generated/prisma'; // Import the Role enum
export const dynamic = 'force-dynamic';
import { unstable_noStore as noStore } from 'next/cache';
export default async function PeoplePage() {
noStore();
  const allPeople = await prisma.person.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });

  const peopleData = {
    Professor: allPeople.filter(p => p.role === Role.PROFESSOR),
    Current: allPeople.filter(p => p.role === Role.CURRENT),
    Alumni: allPeople.filter(p => p.role === Role.ALUMNI),
  };

  return <PeopleClientPage peopleData={peopleData} />;
}
