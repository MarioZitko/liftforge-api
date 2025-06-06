import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ProgramService } from './program.service';

@Controller('program')
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  @Get()
  async getAllPrograms() {
    return this.programService.getAllPrograms();
  }

  @Get(':id')
  async getProgramById(@Param('id') id: string) {
    return this.programService.getProgramById(id);
  }

  @Post()
  async createProgram(@Body() createProgramDto: any) {
    return this.programService.createProgram(createProgramDto);
  }

  @Put(':id')
  async updateProgram(@Param('id') id: string, @Body() updateProgramDto: any) {
    return this.programService.updateProgram(id, updateProgramDto);
  }

  @Delete(':id')
  async deleteProgram(@Param('id') id: string) {
    return this.programService.deleteProgram(id);
  }
}
