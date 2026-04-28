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
import { CreateTrainingExerciseDto } from './dto/create-training-exercise.dto';
import { ReorderTrainingExercisesDto } from './dto/reorder-training-exercises.dto';
import { UpdateTrainingExerciseDto } from './dto/update-training-exercise.dto';
import { TrainingExerciseService } from './training-exercise.service';

@ApiTags('TrainingExercises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('training-exercise')
export class TrainingExerciseController {
  constructor(private readonly service: TrainingExerciseService) {}

  @Post()
  @Roles(Role.COACH, Role.ADMIN)
  create(
    @Body() dto: CreateTrainingExerciseDto,
    @CurrentUser() user: NonNullable<AuthenticatedRequest['user']>,
  ) {
    return this.service.create(dto, user.userId!);
  }

  @Get()
  @Roles(Role.COACH, Role.ADMIN, Role.CLIENT)
  findAll(@Query('trainingId') trainingId?: string) {
    if (trainingId) return this.service.findByTraining(+trainingId);
    return [];
  }

  @Get(':id')
  @Roles(Role.COACH, Role.ADMIN, Role.CLIENT)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch('reorder')
  @Roles(Role.COACH, Role.ADMIN)
  reorder(@Body() dto: ReorderTrainingExercisesDto) {
    return this.service.reorder(dto.trainingId, dto.orderedIds);
  }

  @Patch(':id')
  @Roles(Role.COACH, Role.ADMIN, Role.CLIENT)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTrainingExerciseDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.COACH, Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
