import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CoachService } from './coach.service';
import { CreateCoachDto, UpdateCoachDto, CoachWithDetailsDto } from './dto';
import { InviteClientDto } from './dto/invite-client.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { Role } from 'generated/prisma/client';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

@Controller('coach')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH, Role.ADMIN)
  async create(@Body() createCoachDto: CreateCoachDto) {
    return this.coachService.create(createCoachDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH, Role.ADMIN)
  async findAll(): Promise<CoachWithDetailsDto[]> {
    return this.coachService.findAll();
  }

  @Get('available')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT, Role.ADMIN)
  async findAvailableCoaches(): Promise<CoachWithDetailsDto[]> {
    return this.coachService.findAvailableCoachesWithClientCount();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH, Role.CLIENT, Role.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.coachService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH, Role.ADMIN)
  async update(@Param('id') id: string, @Body() updateCoachDto: UpdateCoachDto) {
    return this.coachService.update(id, updateCoachDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH, Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.coachService.remove(id);
  }

  @Get(':id/clients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH, Role.ADMIN)
  async getCoachClients(@Param('id') id: string) {
    return this.coachService.getCoachClients(id);
  }

  @Post('invite-client')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH, Role.ADMIN)
  async inviteClient(@CurrentUser() user: { userId: string }, @Body() dto: InviteClientDto) {
    return this.coachService.inviteClient(user.userId, dto.email);
  }
}
