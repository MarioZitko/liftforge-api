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
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from 'generated/prisma';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedRequest } from '../auth/interfaces/auth-request.interface';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ProgramService } from './program.service';

@ApiTags('Programs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COACH, Role.ADMIN)
@Controller('programs')
export class ProgramController {
  constructor(private readonly service: ProgramService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get('my')
  async getCoachPrograms(
    @CurrentUser() user: NonNullable<AuthenticatedRequest['user']>,
    @Query('onlyMine') onlyMine: string, // expects "true" or "false"
  ) {
    const onlyMyPrograms = onlyMine === 'true';
    if (!user.userId) {
      throw new UnauthorizedException('Missing user ID in token.');
    }
    return this.service.findForCoach(user.userId, onlyMyPrograms);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const program = await this.service.findOne(+id);
    if (!program) throw new NotFoundException('Program not found');
    return program;
  }

  @Post()
  async create(@Body() dto: CreateProgramDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
