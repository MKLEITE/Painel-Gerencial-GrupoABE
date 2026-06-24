import 'reflect-metadata';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  // --- Segurança de borda ---
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.get<string>('WEB_ORIGIN'),
    credentials: true,
  });

  // --- Contrato de API ---
  app.setGlobalPrefix(config.get<string>('API_GLOBAL_PREFIX') ?? 'api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // --- Validação estrita de TODA entrada (nada confia no cliente) ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // --- Erros padronizados (problem+json) sem vazar detalhes internos ---
  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableShutdownHooks();

  const port = config.get<number>('API_PORT') ?? 3333;
  await app.listen(port);
  console.warn(`[api] ouvindo na porta ${port}`);
}

void bootstrap();
