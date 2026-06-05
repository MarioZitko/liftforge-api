import { PartialType } from '@nestjs/swagger';
import { CreateClientProgramDto } from './create-client-program.dto';

export class UpdateClientProgramDto extends PartialType(CreateClientProgramDto) {}
