import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { Role } from 'generated/prisma/client';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { CoachService } from './coach.service';
import { CreateCoachDto, UpdateCoachDto } from './dto';
import { InviteClientDto } from './dto/invite-client.dto';

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
  async findAll() {
    return this.coachService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH, Role.CLIENT, Role.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.coachService.findOne(id);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH, Role.CLIENT, Role.ADMIN)
  async findByUserId(@Param('userId') userId: string) {
    return this.coachService.findByUserId(userId);
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
