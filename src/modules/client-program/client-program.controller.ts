import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from 'generated/prisma';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedRequest } from '../auth/interfaces/auth-request.interface';
import { ClientProgramService } from './client-program.service';
import { CreateClientProgramDto } from './dto/create-client-program.dto';
import { UpdateClientProgramDto } from './dto/update-client-program.dto';

@ApiTags('ClientPrograms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COACH, Role.ADMIN)
@Controller('ClientPrograms')
export class ClientProgramController {
  constructor(private readonly service: ClientProgramService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get('my')
  async getCoachClientPrograms(@CurrentUser() user: NonNullable<AuthenticatedRequest['user']>) {
    if (!user.userId) {
      throw new UnauthorizedException('Missing user ID in token.');
    }
    return this.service.findForCoach(user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const clientProgram = await this.service.findOne(+id);
    if (!clientProgram) throw new NotFoundException('ClientProgram not found');
    return clientProgram;
  }

  @Post()
  async create(@Body() dto: CreateClientProgramDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateClientProgramDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
