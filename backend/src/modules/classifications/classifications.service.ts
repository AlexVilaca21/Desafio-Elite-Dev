import { Injectable, NotFoundException } from '@nestjs/common';
import { TicketmasterService } from 'modules/service/ticketmaster/ticketmaster.service';
import { TicketmasterClassificationItem } from 'modules/service/ticketmaster/interfaces/ticketmaster.interface';
import { compactParams } from 'modules/shared/utils/compact-params';
import { mapPage } from 'modules/shared/utils/ticketmaster.mapper';
import {
  ClassificationDto,
  ClassificationsSearchResponseDto,
} from './dto/classification.dto';
import { SearchClassificationsQueryDto } from './dto/search-classifications-query.dto';

@Injectable()
export class ClassificationsService {
  constructor(private readonly ticketmasterService: TicketmasterService) {}

  async searchClassifications(
    query: SearchClassificationsQueryDto,
  ): Promise<ClassificationsSearchResponseDto> {
    const response = await this.ticketmasterService.searchClassifications(
      compactParams({
        size: query.size ?? 20,
        page: query.page ?? 0,
        keyword: query.keyword,
      }),
    );

    const classifications = (response._embedded?.classifications ?? [])
      .map((item) => this.mapClassification(item))
      .filter((item): item is ClassificationDto => Boolean(item));

    return {
      classifications,
      page: mapPage(response.page, {
        size: query.size ?? 20,
        number: query.page ?? 0,
        totalElements: classifications.length,
      }),
    };
  }

  async getClassificationById(id: string): Promise<ClassificationDto> {
    const classification = this.mapClassification(
      await this.ticketmasterService.getClassificationById(id),
    );

    if (!classification) {
      throw new NotFoundException('Classification not found');
    }

    return classification;
  }

  private mapClassification(
    item: TicketmasterClassificationItem,
  ): ClassificationDto | undefined {
    const segment = item.segment;

    if (!segment) {
      return undefined;
    }

    return {
      id: segment.id,
      name: segment.name,
      genres:
        segment._embedded?.genres?.map((genre) => ({
          id: genre.id,
          name: genre.name,
          subGenres:
            genre._embedded?.subgenres?.map((subGenre) => ({
              id: subGenre.id,
              name: subGenre.name,
            })) ?? [],
        })) ?? [],
    };
  }
}
