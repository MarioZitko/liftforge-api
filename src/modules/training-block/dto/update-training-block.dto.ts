import { PartialType } from '@nestjs/swagger';
import { CreateTrainingBlockDto } from './create-training-block.dto';

export class UpdateTrainingBlockDto extends PartialType(CreateTrainingBlockDto) { }