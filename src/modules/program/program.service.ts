import { Injectable } from '@nestjs/common';

@Injectable()
export class ProgramService {
  private programs = []; // Temporary in-memory storage

  getAllPrograms() {
    return this.programs;
  }

  getProgramById(id: string) {
    return this.programs.find((program) => program.id === id);
  }

  createProgram(createProgramDto: any) {
    const newProgram = { id: Date.now().toString(), ...createProgramDto };
    this.programs.push(newProgram);
    return newProgram;
  }

  updateProgram(id: string, updateProgramDto: any) {
    const programIndex = this.programs.findIndex((program) => program.id === id);
    if (programIndex === -1) {
      throw new Error('Program not found');
    }
    this.programs[programIndex] = { ...this.programs[programIndex], ...updateProgramDto };
    return this.programs[programIndex];
  }

  deleteProgram(id: string) {
    const programIndex = this.programs.findIndex((program) => program.id === id);
    if (programIndex === -1) {
      throw new Error('Program not found');
    }
    const deletedProgram = this.programs.splice(programIndex, 1);
    return deletedProgram[0];
  }
}
