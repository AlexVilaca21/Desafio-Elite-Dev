import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AttractionsModule } from 'modules/attractions/attractions.module';
import { ClassificationsModule } from 'modules/classifications/classifications.module';
import { EventsModule } from 'modules/events/events.module';
import { SuggestModule } from 'modules/suggest/suggest.module';
import { VenuesModule } from 'modules/venues/venues.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventsModule,
    VenuesModule,
    AttractionsModule,
    ClassificationsModule,
    SuggestModule,
  ],
})
export class AppModule {}
