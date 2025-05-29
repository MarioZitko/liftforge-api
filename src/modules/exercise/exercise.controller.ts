// src/modules/exercise/exercise.controller.ts
import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  NotFoundException,
  Post,
  Patch,
  Body,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { AuthenticatedRequest } from '../auth/interfaces/auth-request.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from 'generated/prisma';

@ApiTags('Exercises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COACH, Role.ADMIN)
@Controller('exercises')
export class ExerciseController {
  constructor(private readonly service: ExerciseService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get('my')
  async getCoachExercises(
    @CurrentUser() user: NonNullable<AuthenticatedRequest['user']>,
    @Query('onlyMine') onlyMine: string, // expects "true" or "false"
  ) {
    const onlyMyExercises = onlyMine === 'true';
    if (!user.userId) {
      throw new UnauthorizedException('Missing user ID in token.');
    }
    return this.service.findForCoach(user.userId, onlyMyExercises);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const exercise = await this.service.findOne(+id);
    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  @Post()
  async create(@Body() dto: CreateExerciseDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateExerciseDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
