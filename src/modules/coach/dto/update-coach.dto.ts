import { PartialType } from '@nestjs/swagger';
import { CreateCoachDto } from './create-coach.dto';

export class UpdateCoachDto extends PartialType(CreateCoachDto) {}
