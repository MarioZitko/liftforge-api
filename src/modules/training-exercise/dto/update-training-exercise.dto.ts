import { PartialType } from "@nestjs/swagger";
import { CreateTrainingExerciseDto } from "./create-training-exercise.dto";

export class UpdateTrainingExerciseDto extends PartialType(CreateTrainingExerciseDto) { }