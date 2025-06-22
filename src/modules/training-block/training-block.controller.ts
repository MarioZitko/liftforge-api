import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateTrainingBlockDto } from './dto/create-training-block.dto';
import { UpdateTrainingBlockDto } from './dto/update-training-block.dto';
import { TrainingBlock, TrainingBlockService } from './training-block.service';

@Controller('training-block')
export class TrainingBlockController {
  constructor(private readonly trainingBlockService: TrainingBlockService) { }

  @Post()
  async create(@Body() createDto: CreateTrainingBlockDto): Promise<TrainingBlock> {
    return await this.trainingBlockService.create(createDto);
  }

  @Get()
  async findAll(): Promise<TrainingBlock[]> {
    return await this.trainingBlockService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TrainingBlock> {
    return await this.trainingBlockService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTrainingBlockDto,
  ): Promise<TrainingBlock> {
    return await this.trainingBlockService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return await this.trainingBlockService.remove(id);
  }
}