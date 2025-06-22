import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrainingBlockDto } from './dto/create-training-block.dto';
import { UpdateTrainingBlockDto } from './dto/update-training-block.dto';

export interface TrainingBlock {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  trainingIds?: string[];
}

@Injectable()
export class TrainingBlockService {
  private trainingBlocks: TrainingBlock[] = [];
  private idCounter = 1;

  create(createDto: CreateTrainingBlockDto): TrainingBlock {
    const trainingBlock: TrainingBlock = {
      id: String(this.idCounter++),
      ...createDto,
    };
    this.trainingBlocks.push(trainingBlock);
    return trainingBlock;
  }

  findAll(): TrainingBlock[] {
    return this.trainingBlocks;
  }

  findOne(id: string): TrainingBlock {
    const block = this.trainingBlocks.find(tb => tb.id === id);
    if (!block) throw new NotFoundException(`TrainingBlock with id ${id} not found`);
    return block;
  }

  update(id: string, updateDto: UpdateTrainingBlockDto): TrainingBlock {
    const block = this.findOne(id);
    Object.assign(block, updateDto);
    return block;
  }

  remove(id: string): { message: string } {
    const idx = this.trainingBlocks.findIndex(tb => tb.id === id);
    if (idx === -1) throw new NotFoundException(`TrainingBlock with id ${id} not found`);
    this.trainingBlocks.splice(idx, 1);
    return { message: `TrainingBlock ${id} removed` };
  }
}