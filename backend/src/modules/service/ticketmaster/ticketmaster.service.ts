import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import {
  TicketmasterEventDetailResponse,
  TicketmasterEventsSearchResponse,
} from './interfaces/ticketmaster.interface';

@Injectable()
export class TicketmasterService {
  private readonly logger = new Logger(TicketmasterService.name);
  private readonly baseUrl = 'https://app.ticketmaster.com/discovery/v2';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  searchEvents(
    params: Record<string, string | number>,
  ): Promise<TicketmasterEventsSearchResponse> {
    return this.request<TicketmasterEventsSearchResponse>(
      '/events.json',
      params,
    );
  }

  getEventById(id: string): Promise<TicketmasterEventDetailResponse> {
    return this.request<TicketmasterEventDetailResponse>(`/events/${id}.json`);
  }

  private async request<T>(
    path: string,
    params: Record<string, string | number> = {},
  ): Promise<T> {
    const apiKey = this.configService.get<string>('TICKETMASTER_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException(
        'TICKETMASTER_API_KEY is not configured',
      );
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<T>(`${this.baseUrl}${path}`, {
          params: { ...params, apikey: apiKey },
        }),
      );

      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof AxiosError) {
      const status = error.response?.status;

      if (status === 404) {
        throw new NotFoundException('Event not found on Ticketmaster');
      }

      if (status === 401 || status === 403) {
        throw new InternalServerErrorException(
          'Invalid or unauthorized Ticketmaster API key',
        );
      }

      this.logger.error(
        `Ticketmaster API error: ${error.message}`,
        error.response?.data,
      );
    }

    throw new InternalServerErrorException(
      'Failed to fetch data from Ticketmaster',
    );
  }
}
