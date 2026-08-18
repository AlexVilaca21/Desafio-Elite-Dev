-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "seatRow" TEXT,
ADD COLUMN "seatNumber" INTEGER;

UPDATE "Ticket" AS ticket
SET "seatRow" = seat.row,
    "seatNumber" = seat.number
FROM "Seat" AS seat
WHERE ticket."seatId" = seat.id;

ALTER TABLE "Ticket" ALTER COLUMN "seatRow" SET NOT NULL;
ALTER TABLE "Ticket" ALTER COLUMN "seatNumber" SET NOT NULL;

ALTER TABLE "Ticket" ALTER COLUMN "seatId" DROP NOT NULL;
