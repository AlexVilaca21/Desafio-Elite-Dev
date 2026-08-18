import { HttpService } from '@nestjs/axios';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosError, AxiosHeaders, AxiosResponse } from 'axios';
import { Observable, of, throwError } from 'rxjs';
import { TicketmasterService } from './ticketmaster.service';

describe('TicketmasterService', () => {
  let service: TicketmasterService;
  let httpService: { get: jest.Mock };

  const mockApiKey = 'test-api-key';

  const mockResponse = <T>(data: T): Observable<AxiosResponse<T>> =>
    of({ data } as AxiosResponse<T>);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketmasterService,
        {
          provide: HttpService,
          useValue: { get: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(mockApiKey) },
        },
      ],
    }).compile();

    service = module.get(TicketmasterService);
    httpService = module.get(HttpService);
  });

  it('should search events', async () => {
    const payload = { _embedded: { events: [] }, page: { size: 20 } };
    httpService.get.mockReturnValue(mockResponse(payload));

    const result = await service.searchEvents({ keyword: 'rock', page: 0 });

    expect(httpService.get).toHaveBeenCalledWith(
      'https://app.ticketmaster.com/discovery/v2/events.json',
      {
        params: {
          locale: '*',
          keyword: 'rock',
          page: 0,
          apikey: mockApiKey,
        },
      },
    );
    expect(result).toEqual(payload);
  });

  it('should get event by id', async () => {
    const payload = { id: 'event-1', name: 'Rock Show' };
    httpService.get.mockReturnValue(mockResponse(payload));

    const result = await service.getEventById('event-1');

    expect(httpService.get).toHaveBeenCalledWith(
      'https://app.ticketmaster.com/discovery/v2/events/event-1.json',
      { params: { locale: '*', apikey: mockApiKey } },
    );
    expect(result).toEqual(payload);
  });

  it('should search venues by state', async () => {
    const payload = { _embedded: { venues: [] } };
    httpService.get.mockReturnValue(mockResponse(payload));

    await service.searchVenues({ stateCode: 'SP', countryCode: 'BR' });

    expect(httpService.get).toHaveBeenCalledWith(
      'https://app.ticketmaster.com/discovery/v2/venues.json',
      {
        params: {
          locale: '*',
          stateCode: 'SP',
          countryCode: 'BR',
          apikey: mockApiKey,
        },
      },
    );
  });

  it('should search attractions, classifications and suggest', async () => {
    httpService.get.mockReturnValue(mockResponse({}));

    await service.searchAttractions({ keyword: 'madonna' });
    await service.searchClassifications({ keyword: 'music' });
    await service.suggest({ keyword: 'rock', countryCode: 'BR' });
    await service.getEventImages('event-1');
    await service.getVenueById('venue-1');
    await service.getAttractionById('attr-1');
    await service.getClassificationById('class-1');

    expect(httpService.get).toHaveBeenCalledWith(
      'https://app.ticketmaster.com/discovery/v2/attractions.json',
      { params: { locale: '*', keyword: 'madonna', apikey: mockApiKey } },
    );
    expect(httpService.get).toHaveBeenCalledWith(
      'https://app.ticketmaster.com/discovery/v2/classifications.json',
      { params: { locale: '*', keyword: 'music', apikey: mockApiKey } },
    );
    expect(httpService.get).toHaveBeenCalledWith(
      'https://app.ticketmaster.com/discovery/v2/suggest.json',
      {
        params: {
          locale: '*',
          keyword: 'rock',
          countryCode: 'BR',
          apikey: mockApiKey,
        },
      },
    );
    expect(httpService.get).toHaveBeenCalledWith(
      'https://app.ticketmaster.com/discovery/v2/events/event-1/images.json',
      { params: { locale: '*', apikey: mockApiKey } },
    );
    expect(httpService.get).toHaveBeenCalledWith(
      'https://app.ticketmaster.com/discovery/v2/venues/venue-1.json',
      { params: { locale: '*', apikey: mockApiKey } },
    );
    expect(httpService.get).toHaveBeenCalledWith(
      'https://app.ticketmaster.com/discovery/v2/attractions/attr-1.json',
      { params: { locale: '*', apikey: mockApiKey } },
    );
    expect(httpService.get).toHaveBeenCalledWith(
      'https://app.ticketmaster.com/discovery/v2/classifications/class-1.json',
      { params: { locale: '*', apikey: mockApiKey } },
    );
  });

  it('should throw when API key is missing', async () => {
    const module = await Test.createTestingModule({
      providers: [
        TicketmasterService,
        { provide: HttpService, useValue: { get: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    const serviceWithoutKey = module.get(TicketmasterService);

    await expect(serviceWithoutKey.searchEvents({})).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('should throw NotFoundException on 404', async () => {
    const axiosError = new AxiosError('Not found');
    axiosError.response = {
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    };

    httpService.get.mockReturnValue(throwError(() => axiosError));

    await expect(service.getEventById('invalid')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw TOO_MANY_REQUESTS on 429', async () => {
    const axiosError = new AxiosError('Too many requests');
    axiosError.response = {
      status: 429,
      statusText: 'Too Many Requests',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    };

    httpService.get.mockReturnValue(throwError(() => axiosError));

    await expect(service.searchEvents({})).rejects.toThrow(
      /catálogo está ocupado/,
    );
  });

  it('should throw InternalServerErrorException on network error', async () => {
    httpService.get.mockReturnValue(
      throwError(() => new AxiosError('Network error')),
    );

    await expect(service.searchEvents({})).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
