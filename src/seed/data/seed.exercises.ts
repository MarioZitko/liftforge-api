import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

export async function seedExercises(prisma: PrismaService) {
  const filePath = path.join(__dirname, 'exercises.json');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const exercises = JSON.parse(rawData);

  for (const exercise of exercises) {
    const exists = await prisma.exercise.findFirst({
      where: { name: exercise.name },
    });

    if (!exists) {
      const primaryMuscles = Array.isArray(exercise.primaryMuscles)
        ? exercise.primaryMuscles.map((m: string) => m.toUpperCase())
        : [];

      const secondaryMuscles = Array.isArray(exercise.secondaryMuscles)
        ? exercise.secondaryMuscles.map((m: string) => m.toUpperCase())
        : [];

      await prisma.exercise.create({
        data: {
          name: exercise.name,
          description: exercise.instructions?.join('\n') || null,
          tutorialUrl: exercise.youtubeUrl || null,
          primaryMuscles,
          secondaryMuscles,
        },
      });
    }
  }
}
