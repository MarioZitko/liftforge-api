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
import { CreateTrainingBlockDto } from './dto/create-training-block.dto';
import { UpdateTrainingBlockDto } from './dto/update-training-block.dto';
import { TrainingBlockService } from './training-block.service';

@ApiTags('TrainingBlocks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('training-block')
export class TrainingBlockController {
  constructor(private readonly service: TrainingBlockService) {}

  @Post()
  @Roles(Role.COACH, Role.ADMIN)
  create(
    @Body() dto: CreateTrainingBlockDto,
    @CurrentUser() user: NonNullable<AuthenticatedRequest['user']>,
  ) {
    return this.service.create(dto, user.userId!);
  }

  @Get()
  @Roles(Role.COACH, Role.ADMIN, Role.CLIENT)
  findAll(@Query('programId') programId?: string) {
    if (programId) return this.service.findByProgram(+programId);
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
    @Body() dto: UpdateTrainingBlockDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.COACH, Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
