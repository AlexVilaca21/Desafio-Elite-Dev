import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { EventSeatingDto } from './dto/seating.dto';
import { EventsService } from './events.service';

@Injectable()
export class SeatingLiveService {
  private readonly subjects = new Map<string, Subject<MessageEvent>>();
  private readonly listeners = new Map<string, number>();

  constructor(private readonly eventsService: EventsService) {}

  watch(eventId: string): Observable<MessageEvent> {
    const subject = this.subjectFor(eventId);

    return new Observable((subscriber) => {
      this.listeners.set(eventId, (this.listeners.get(eventId) ?? 0) + 1);
      const subscription = subject.subscribe(subscriber);
      void this.push(eventId);

      return () => {
        subscription.unsubscribe();
        const remaining = (this.listeners.get(eventId) ?? 1) - 1;
        if (remaining <= 0) {
          this.listeners.delete(eventId);
          this.subjects.delete(eventId);
          subject.complete();
          return;
        }

        this.listeners.set(eventId, remaining);
      };
    });
  }

  async notify(eventId: string): Promise<void> {
    if (!this.subjects.has(eventId)) {
      return;
    }

    await this.push(eventId);
  }

  private async push(eventId: string): Promise<void> {
    const subject = this.subjects.get(eventId);

    if (!subject) {
      return;
    }

    const data: EventSeatingDto =
      await this.eventsService.getEventSeating(eventId);
    subject.next({ data });
  }

  private subjectFor(eventId: string): Subject<MessageEvent> {
    const existing = this.subjects.get(eventId);

    if (existing) {
      return existing;
    }

    const created = new Subject<MessageEvent>();
    this.subjects.set(eventId, created);
    return created;
  }
}
