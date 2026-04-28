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
@Controller('programs')
export class ProgramController {
  constructor(private readonly service: ProgramService) {}

  @Get()
  @Roles(Role.COACH, Role.ADMIN)
  async findAll() {
    return this.service.findAll();
  }

  @Get('my')
  @Roles(Role.COACH, Role.ADMIN)
  async getCoachPrograms(
    @CurrentUser() user: NonNullable<AuthenticatedRequest['user']>,
    @Query('onlyMine') onlyMine: string,
  ) {
    const onlyMyPrograms = onlyMine === 'true';
    if (!user.userId) {
      throw new UnauthorizedException('Missing user ID in token.');
    }
    return this.service.findForCoach(user.userId, onlyMyPrograms);
  }

  @Get(':id')
  @Roles(Role.COACH, Role.ADMIN, Role.CLIENT)
  async findOne(@Param('id') id: string) {
    const program = await this.service.findOne(+id);
    if (!program) throw new NotFoundException('Program not found');
    return program;
  }

  @Post()
  @Roles(Role.COACH, Role.ADMIN)
  async create(
    @Body() dto: CreateProgramDto,
    @CurrentUser() user: NonNullable<AuthenticatedRequest['user']>,
  ) {
    return this.service.create(dto, user.userId!);
  }

  @Patch(':id')
  @Roles(Role.COACH, Role.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  @Roles(Role.COACH, Role.ADMIN)
  async delete(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
