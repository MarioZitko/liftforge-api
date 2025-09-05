// src/modules/exercise/exercise.controller.ts
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from 'generated/prisma';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedRequest } from '../auth/interfaces/auth-request.interface';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ExerciseService } from './exercise.service';

@ApiTags('Exercises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exercises')
export class ExerciseController {
  constructor(private readonly service: ExerciseService) {}

  @Get()
  @Roles(Role.COACH, Role.ADMIN, Role.CLIENT)
  async findAll() {
    return this.service.findAll();
  }

  @Get('my')
  @Roles(Role.COACH, Role.ADMIN)
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
  @Roles(Role.COACH, Role.ADMIN, Role.CLIENT)
  async findOne(@Param('id') id: string) {
    const exercise = await this.service.findOne(+id);
    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  @Post()
  @Roles(Role.COACH, Role.ADMIN)
  async create(@Body() dto: CreateExerciseDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(Role.COACH, Role.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateExerciseDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  @Roles(Role.COACH, Role.ADMIN)
  async delete(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
