export class ClassificationLevelDto {
  id: string;
  name: string;
}

export class ClassificationGenreDto extends ClassificationLevelDto {
  subGenres: ClassificationLevelDto[];
}

export class ClassificationDto {
  id: string;
  name: string;
  genres: ClassificationGenreDto[];
}

export class ClassificationsSearchResponseDto {
  classifications: ClassificationDto[];
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}
