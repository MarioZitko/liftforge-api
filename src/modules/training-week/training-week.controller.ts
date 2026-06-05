import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { AuthenticatedRequest } from '@/modules/auth/interfaces/auth-request.interface';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from 'generated/prisma';
import { CreateTrainingWeekDto } from './dto/create-training-week.dto';
import { UpdateTrainingWeekDto } from './dto/update-training-week.dto';
import { TrainingWeekService } from './training-week.service';

@ApiTags('TrainingWeeks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('training-week')
export class TrainingWeekController {
  constructor(private readonly service: TrainingWeekService) {}

  @Post()
  @Roles(Role.COACH, Role.ADMIN)
  create(
    @Body() dto: CreateTrainingWeekDto,
    @CurrentUser() user: NonNullable<AuthenticatedRequest['user']>,
  ) {
    return this.service.create(dto, user.userId!);
  }

  @Get()
  @Roles(Role.COACH, Role.ADMIN, Role.CLIENT)
  findAll(@Query('blockId') blockId?: string) {
    if (blockId) return this.service.findByBlock(+blockId);
    return [];
  }

  @Get(':id')
  @Roles(Role.COACH, Role.ADMIN, Role.CLIENT)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.COACH, Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTrainingWeekDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.COACH, Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
