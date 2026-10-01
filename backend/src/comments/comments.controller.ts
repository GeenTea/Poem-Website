import { Controller } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

@Controller('comments')
export class CommentsController {}