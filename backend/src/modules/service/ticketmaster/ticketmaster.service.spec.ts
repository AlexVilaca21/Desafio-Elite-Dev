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
      { params: { apikey: mockApiKey } },
    );
    expect(result).toEqual(payload);
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

  it('should throw InternalServerErrorException on network error', async () => {
    httpService.get.mockReturnValue(
      throwError(() => new AxiosError('Network error')),
    );

    await expect(service.searchEvents({})).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
