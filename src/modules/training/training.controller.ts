import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { AuthenticatedRequest } from '@/modules/auth/interfaces/auth-request.interface';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from 'generated/prisma';
import { CreateTrainingDto } from './dto/create-training.dto';
import { ScheduleProgramDto } from './dto/schedule-program.dto';
import { TrainingCalendarItemDto } from './dto/training-calendar-item.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { TrainingService } from './training.service';

@ApiTags('Trainings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('training')
export class TrainingController {
  constructor(private readonly service: TrainingService) {}

  @Post()
  @Roles(Role.COACH, Role.ADMIN)
  create(
    @Body() dto: CreateTrainingDto,
    @CurrentUser() user: NonNullable<AuthenticatedRequest['user']>,
  ) {
    return this.service.create(dto, user.userId!);
  }

  @Post('schedule-program')
  @Roles(Role.COACH, Role.ADMIN)
  scheduleProgram(@Body() dto: ScheduleProgramDto) {
    return this.service.scheduleProgram(dto);
  }

  @Get('calendar')
  @Roles(Role.COACH, Role.ADMIN)
  getCoachCalendar(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @CurrentUser() user: NonNullable<AuthenticatedRequest['user']>,
  ): Promise<TrainingCalendarItemDto[]> {
    return this.service.findForCoachCalendar(user.userId!, dateFrom, dateTo);
  }

  @Get('my-calendar')
  @Roles(Role.CLIENT)
  getClientCalendar(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @CurrentUser() user: NonNullable<AuthenticatedRequest['user']>,
  ): Promise<TrainingCalendarItemDto[]> {
    return this.service.findForClientCalendar(user.userId!, dateFrom, dateTo);
  }

  @Get()
  @Roles(Role.COACH, Role.ADMIN, Role.CLIENT)
  findAll(@Query('weekId') weekId?: string) {
    if (weekId) return this.service.findByWeek(+weekId);
    return [];
  }

  @Get(':id')
  @Roles(Role.COACH, Role.ADMIN, Role.CLIENT)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.COACH, Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTrainingDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.COACH, Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
