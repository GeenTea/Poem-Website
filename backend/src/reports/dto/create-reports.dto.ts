import { Transform } from 'class-transformer';
import { IsIn, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ReportType } from 'generated/prisma/client';

// На что можно пожаловаться сейчас. USER добавим, когда будет страница пользователя.
export const REPORTABLE_TYPES = [ReportType.COMMENT, ReportType.POEM] as const;
export type ReportableType = (typeof REPORTABLE_TYPES)[number];

export class CreateReportDto {
    // Что именно: комментарий или стих
    @IsIn(REPORTABLE_TYPES)
    type!: ReportableType;

    // id комментария или стиха (в зависимости от type)
    @IsString()
    @IsNotEmpty()
    targetId!: string;

    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    reason!: string;
}
