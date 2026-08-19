import { join } from 'path';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpExceptionFilter } from 'modules/shared/http/http-exception.filter';
import { AppModule } from './app.module';

function isAllowedOrigin(origin: string): boolean {
  const extra = process.env.FRONTEND_ORIGIN;

  try {
    const { hostname } = new URL(origin);
    return (
      hostname === 'localhost' ||
      hostname.endsWith('.onrender.com') ||
      origin === extra
    );
  } catch {
    return false;
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const details = errors.flatMap((error) =>
          Object.values(error.constraints ?? {}),
        );

        return new BadRequestException(
          details.length
            ? `Confira os filtros: ${details.join('. ')}.`
            : 'Confira os dados enviados. Alguns valores estão inválidos.',
        );
      },
    }),
  );

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: (origin, callback) => {
      callback(null, !origin || isAllowedOrigin(origin));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
