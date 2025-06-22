import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrainingWeekDto } from './dto/create-training-week.dto';
import { UpdateTrainingWeekDto } from './dto/update-training-week.dto';

export interface TrainingWeek {
  id: string;
  name: string;
  description?: string;
  order?: number;
  isActive?: boolean;
  trainingBlockId?: string;
  trainingIds?: string[];
}

@Injectable()
export class TrainingWeekService {
  private trainingWeeks: TrainingWeek[] = [];
  private idCounter = 1;

  create(createDto: CreateTrainingWeekDto): TrainingWeek {
    const trainingWeek: TrainingWeek = {
      id: String(this.idCounter++),
      ...createDto,
    };
    this.trainingWeeks.push(trainingWeek);
    return trainingWeek;
  }

  findAll(): TrainingWeek[] {
    return this.trainingWeeks;
  }

  findOne(id: string): TrainingWeek {
    const week = this.trainingWeeks.find(tw => tw.id === id);
    if (!week) throw new NotFoundException(`TrainingWeek with id ${id} not found`);
    return week;
  }

  update(id: string, updateDto: UpdateTrainingWeekDto): TrainingWeek {
    const week = this.findOne(id);
    Object.assign(week, updateDto);
    return week;
  }

  remove(id: string): { message: string } {
    const idx = this.trainingWeeks.findIndex(tw => tw.id === id);
    if (idx === -1) throw new NotFoundException(`TrainingWeek with id ${id} not found`);
    this.trainingWeeks.splice(idx, 1);
    return { message: `TrainingWeek ${id} removed` };
  }
}