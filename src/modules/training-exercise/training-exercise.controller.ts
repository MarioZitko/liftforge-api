import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateTrainingExerciseDto } from './dto/create-training-exercise.dto';
import { UpdateTrainingExerciseDto } from './dto/update-training-exercise.dto';
import { TrainingExercise, TrainingExerciseService } from './training-exercise.service';

@Controller('training-exercise')
export class TrainingExerciseController {
  constructor(private readonly trainingExerciseService: TrainingExerciseService) { }

  @Post()
  async create(@Body() createDto: CreateTrainingExerciseDto): Promise<TrainingExercise> {
    return await this.trainingExerciseService.create(createDto);
  }

  @Get()
  async findAll(): Promise<TrainingExercise[]> {
    return await this.trainingExerciseService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TrainingExercise> {
    return await this.trainingExerciseService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTrainingExerciseDto,
  ): Promise<TrainingExercise> {
    return await this.trainingExerciseService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return await this.trainingExerciseService.remove(id);
  }
}