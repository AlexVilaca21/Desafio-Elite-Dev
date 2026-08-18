import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { buildSeatLayout } from '../src/modules/shared/utils/seat-layout';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'senha123';
const SEED_EVENT_ID = 'seed-noite-elite';

const users: Array<{ name: string; email: string; role: Role }> = [
  {
    name: 'Organizador Elite',
    email: 'organizador@elite.dev',
    role: Role.ORGANIZER,
  },
  {
    name: 'Cliente Ana',
    email: 'cliente@elite.dev',
    role: Role.CLIENT,
  },
  {
    name: 'Cliente Bruno',
    email: 'cliente2@elite.dev',
    role: Role.CLIENT,
  },
  {
    name: 'Portaria',
    email: 'portaria@elite.dev',
    role: Role.GATE,
  },
];

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
      },
      create: {
        name: user.name,
        email: user.email,
        role: user.role,
        passwordHash,
      },
    });
  }

  const existing = await prisma.publishedEvent.findUnique({
    where: { ticketmasterId: SEED_EVENT_ID },
  });

  if (!existing) {
    await prisma.publishedEvent.create({
      data: {
        ticketmasterId: SEED_EVENT_ID,
        name: 'Noite Elite — Rock na Arena',
        startDate: '2026-09-18',
        startTime: '21:00:00',
        venueName: 'Arena Elite',
        venueCity: 'São Paulo',
        venueStateCode: 'SP',
        currency: 'BRL',
        unitPrice: 150,
        seats: {
          create: buildSeatLayout(96),
        },
      },
    });
  }
}

void main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
