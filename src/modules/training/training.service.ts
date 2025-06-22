import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';

export interface Training {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  trainingBlockId?: string;
  exerciseIds?: string[];
}

@Injectable()
export class TrainingService {
  private trainings: Training[] = [];
  private idCounter = 1;

  create(createTrainingDto: CreateTrainingDto): Training {
    const training: Training = {
      id: String(this.idCounter++),
      ...createTrainingDto,
    };
    this.trainings.push(training);
    return training;
  }

  findAll(): Training[] {
    return this.trainings;
  }

  findOne(id: string): Training {
    const training = this.trainings.find(t => t.id === id);
    if (!training) {
      throw new NotFoundException(`Training with id ${id} not found`);
    }
    return training;
  }

  update(id: string, updateTrainingDto: UpdateTrainingDto): Training {
    const training = this.findOne(id);
    Object.assign(training, updateTrainingDto);
    return training;
  }

  remove(id: string): { message: string } {
    const index = this.trainings.findIndex(t => t.id === id);
    if (index === -1) {
      throw new NotFoundException(`Training with id ${id} not found`);
    }
    this.trainings.splice(index, 1);
    return { message: `Training ${id} removed` };
  }
}