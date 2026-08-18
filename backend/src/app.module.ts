import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AttractionsModule } from 'modules/attractions/attractions.module';
import { AuthModule } from 'modules/auth/auth.module';
import { ClassificationsModule } from 'modules/classifications/classifications.module';
import { EventsModule } from 'modules/events/events.module';
import { PrismaModule } from 'modules/prisma/prisma.module';
import { ReservationsModule } from 'modules/reservations/reservations.module';
import { SuggestModule } from 'modules/suggest/suggest.module';
import { TicketsModule } from 'modules/tickets/tickets.module';
import { UsersModule } from 'modules/users/users.module';
import { VenuesModule } from 'modules/venues/venues.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    EventsModule,
    VenuesModule,
    AttractionsModule,
    ClassificationsModule,
    SuggestModule,
    TicketsModule,
    ReservationsModule,
  ],
})
export class AppModule {}
