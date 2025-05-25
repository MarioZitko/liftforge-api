import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CoachService } from './coach.service';
import { CreateCoachDto, UpdateCoachDto } from './dto';

@Controller('coach')
export class CoachController {
  constructor(private readonly coachService: CoachService) { }

  @Post()
  async create(@Body() createCoachDto: CreateCoachDto) {
    return this.coachService.create(createCoachDto);
  }

  @Get()
  async findAll() {
    return this.coachService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coachService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateCoachDto: UpdateCoachDto) {
    return this.coachService.update(id, updateCoachDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.coachService.remove(id);
  }

  @Get(':id/clients')
  async getCoachClients(@Param('id') id: string) {
    return this.coachService.getCoachClients(id);
  }
}