import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AttractionsModule } from 'modules/attractions/attractions.module';
import { ClassificationsModule } from 'modules/classifications/classifications.module';
import { EventsModule } from 'modules/events/events.module';
import { PrismaModule } from 'modules/prisma/prisma.module';
import { ReservationsModule } from 'modules/reservations/reservations.module';
import { SuggestModule } from 'modules/suggest/suggest.module';
import { VenuesModule } from 'modules/venues/venues.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    EventsModule,
    VenuesModule,
    AttractionsModule,
    ClassificationsModule,
    SuggestModule,
    ReservationsModule,
  ],
})
export class AppModule {}
