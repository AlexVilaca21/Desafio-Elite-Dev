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
  TicketmasterAttraction,
  TicketmasterAttractionsSearchResponse,
  TicketmasterClassificationItem,
  TicketmasterClassificationsSearchResponse,
  TicketmasterEventDetailResponse,
  TicketmasterEventImagesResponse,
  TicketmasterEventsSearchResponse,
  TicketmasterSuggestResponse,
  TicketmasterVenue,
  TicketmasterVenuesSearchResponse,
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

  getEventImages(id: string): Promise<TicketmasterEventImagesResponse> {
    return this.request<TicketmasterEventImagesResponse>(
      `/events/${id}/images.json`,
    );
  }

  searchVenues(
    params: Record<string, string | number>,
  ): Promise<TicketmasterVenuesSearchResponse> {
    return this.request<TicketmasterVenuesSearchResponse>(
      '/venues.json',
      params,
    );
  }

  getVenueById(id: string): Promise<TicketmasterVenue> {
    return this.request<TicketmasterVenue>(`/venues/${id}.json`);
  }

  searchAttractions(
    params: Record<string, string | number>,
  ): Promise<TicketmasterAttractionsSearchResponse> {
    return this.request<TicketmasterAttractionsSearchResponse>(
      '/attractions.json',
      params,
    );
  }

  getAttractionById(id: string): Promise<TicketmasterAttraction> {
    return this.request<TicketmasterAttraction>(`/attractions/${id}.json`);
  }

  searchClassifications(
    params: Record<string, string | number>,
  ): Promise<TicketmasterClassificationsSearchResponse> {
    return this.request<TicketmasterClassificationsSearchResponse>(
      '/classifications.json',
      params,
    );
  }

  getClassificationById(id: string): Promise<TicketmasterClassificationItem> {
    return this.request<TicketmasterClassificationItem>(
      `/classifications/${id}.json`,
    );
  }

  suggest(
    params: Record<string, string | number>,
  ): Promise<TicketmasterSuggestResponse> {
    return this.request<TicketmasterSuggestResponse>('/suggest.json', params);
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
          params: {
            locale: '*',
            ...params,
            apikey: apiKey,
          },
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
        throw new NotFoundException('Resource not found on Ticketmaster');
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
