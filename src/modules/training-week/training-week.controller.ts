import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateTrainingWeekDto } from './dto/create-training-week.dto';
import { UpdateTrainingWeekDto } from './dto/update-training-week.dto';
import { TrainingWeek, TrainingWeekService } from './training-week.service';

@Controller('training-week')
export class TrainingWeekController {
  constructor(private readonly trainingWeekService: TrainingWeekService) { }

  @Post()
  async create(@Body() createDto: CreateTrainingWeekDto): Promise<TrainingWeek> {
    return await this.trainingWeekService.create(createDto);
  }

  @Get()
  async findAll(): Promise<TrainingWeek[]> {
    return await this.trainingWeekService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TrainingWeek> {
    return await this.trainingWeekService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTrainingWeekDto,
  ): Promise<TrainingWeek> {
    return await this.trainingWeekService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return await this.trainingWeekService.remove(id);
  }
}