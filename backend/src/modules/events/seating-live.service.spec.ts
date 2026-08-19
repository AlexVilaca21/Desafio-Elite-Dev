import { MessageEvent } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { EventsService } from './events.service';
import { SeatingLiveService } from './seating-live.service';

describe('SeatingLiveService', () => {
  const snapshot = {
    event: { id: 'event-1', name: 'Rock Show', currency: 'BRL', unitPrice: 150 },
    rows: [],
    availableCount: 10,
  };

  const eventsService = {
    getEventSeating: jest.fn(),
  };

  let service: SeatingLiveService;

  beforeEach(() => {
    eventsService.getEventSeating.mockReset();
    eventsService.getEventSeating.mockResolvedValue(snapshot);
    service = new SeatingLiveService(
      eventsService as unknown as EventsService,
    );
  });

  it('should send the current map when someone starts watching', async () => {
    const event = await firstValueFrom(service.watch('event-1'));

    expect(eventsService.getEventSeating).toHaveBeenCalledWith('event-1');
    expect((event as MessageEvent).data).toEqual(snapshot);
  });

  it('should push an update to listeners after a sale or cancel', async () => {
    const received: unknown[] = [];
    const subscription = service.watch('event-1').subscribe((event) => {
      received.push(event.data);
    });

    await new Promise((resolve) => setImmediate(resolve));
    eventsService.getEventSeating.mockResolvedValue({
      ...snapshot,
      availableCount: 9,
    });
    await service.notify('event-1');

    expect(received.at(-1)).toEqual({ ...snapshot, availableCount: 9 });
    subscription.unsubscribe();
  });

  it('should skip notify when nobody is watching the event', async () => {
    await service.notify('event-1');
    expect(eventsService.getEventSeating).not.toHaveBeenCalled();
  });
});
