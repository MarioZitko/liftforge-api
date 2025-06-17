import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  NotFoundException,
  Query,
  Post,
  Put,
  Body,
} from '@nestjs/common';
import { PaginatedRequest, PaginatedResponse } from '@/common/types/pagination';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from 'generated/prisma';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto, PaginatedUserDto } from './user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Get('by-email')
  async findByEmail(@Query('email') email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Get('by-name')
  async findByName(@Query('name') name: string) {
    return this.userService.findByName(name);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    console.log('Deleting user:', id); // ✅ Should print UUID
    return this.userService.delete(id);
  }
  @Get('paginated')
  async getPaginated(
    @Query() request: PaginatedRequest,
  ): Promise<PaginatedResponse<PaginatedUserDto>> {
    return this.userService.getPaginated(request);
  }
}
