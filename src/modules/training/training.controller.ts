import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { TrainingService } from './training.service';

@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) { }

  @Post()
  async create(@Body() createTrainingDto: CreateTrainingDto) {
    return await this.trainingService.create(createTrainingDto);
  }

  @Get()
  async findAll() {
    return await this.trainingService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.trainingService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTrainingDto: UpdateTrainingDto) {
    return await this.trainingService.update(id, updateTrainingDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.trainingService.remove(id);
  }
}