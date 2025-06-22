import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrainingExerciseDto } from './dto/create-training-exercise.dto';
import { UpdateTrainingExerciseDto } from './dto/update-training-exercise.dto';

export interface TrainingExercise {
  id: string;
  name: string;
  description?: string;
  order?: number;
  isActive?: boolean;
  trainingId?: string;
  exerciseId?: string;
}

@Injectable()
export class TrainingExerciseService {
  private trainingExercises: TrainingExercise[] = [];
  private idCounter = 1;

  create(createDto: CreateTrainingExerciseDto): TrainingExercise {
    const trainingExercise: TrainingExercise = {
      id: String(this.idCounter++),
      ...createDto,
    };
    this.trainingExercises.push(trainingExercise);
    return trainingExercise;
  }

  findAll(): TrainingExercise[] {
    return this.trainingExercises;
  }

  findOne(id: string): TrainingExercise {
    const exercise = this.trainingExercises.find(te => te.id === id);
    if (!exercise) throw new NotFoundException(`TrainingExercise with id ${id} not found`);
    return exercise;
  }

  update(id: string, updateDto: UpdateTrainingExerciseDto): TrainingExercise {
    const exercise = this.findOne(id);
    Object.assign(exercise, updateDto);
    return exercise;
  }

  remove(id: string): { message: string } {
    const idx = this.trainingExercises.findIndex(te => te.id === id);
    if (idx === -1) throw new NotFoundException(`TrainingExercise with id ${id} not found`);
    this.trainingExercises.splice(idx, 1);
    return { message: `TrainingExercise ${id} removed` };
  }
}