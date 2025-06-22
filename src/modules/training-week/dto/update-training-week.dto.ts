import { PartialType } from '@nestjs/swagger';
import { CreateTrainingWeekDto } from './create-training-week.dto';

export class UpdateTrainingWeekDto extends PartialType(CreateTrainingWeekDto) { }