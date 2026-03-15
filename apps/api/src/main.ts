import './instrument';

import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV');

  // Request-ID propagation: set on request + response for cross-service tracing
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", configService.get<string>('R2_PUBLIC_URL') || ''].filter(Boolean),
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(compression());

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.use(cookieParser());

  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  if (!corsOrigin && ['production', 'staging'].includes(nodeEnv || '')) {
    throw new Error('CORS_ORIGIN must be set in production and staging');
  }
  if (!corsOrigin) {
    const logger = app.get(Logger);
    logger.warn(
      'CORS_ORIGIN not set — using localhost fallback. Set CORS_ORIGIN in .env for explicit control.',
    );
  }
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : 'http://localhost:3000',
    credentials: true,
  });

  if (nodeEnv === 'development') {
    const config = new DocumentBuilder()
      .setTitle('EPDE API')
      .setDescription('API de la plataforma de mantenimiento preventivo para viviendas')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get<number>('PORT') ?? 3001;
  await app.listen(port);
}
bootstrap();
