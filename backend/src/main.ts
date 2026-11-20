import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { UPLOADS_DIR } from './common/uploads';

async function bootstrap() {
  // NestExpressApplication — чтобы был useStaticAssets
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Загруженные файлы (аватары): backend/uploads/... → http://localhost:3001/uploads/...
  app.useStaticAssets(UPLOADS_DIR, { prefix: '/uploads/' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin:['http://localhost:3000'],
    credentials:true
  })

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
