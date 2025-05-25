import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto, UpdateClientDto } from './dto';

@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) { }

  @Post()
  async create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  @Get()
  async findAll() {
    return this.clientService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.clientService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientService.update(id, updateClientDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.clientService.remove(id);
  }

  @Get(':id/programs')
  async getClientPrograms(@Param('id') id: string) {
    return this.clientService.getClientPrograms(id);
  }
}