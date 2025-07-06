import { PrismaService } from '@/prisma/prisma.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedValidData(prisma: PrismaService) {
  const coaches = await prisma.coach.findMany();
  const clients = await prisma.client.findMany();
  const exercises = await prisma.exercise.findMany();

  if (coaches.length === 0 || clients.length === 0 || exercises.length < 4) {
    console.log('Not enough coaches, clients, or exercises to seed programs.');
    return;
  }

  const clientsPerCoach = 3;
  let clientIndex = 0;

  for (const coach of coaches) {
    const assignedClients = clients.slice(clientIndex, clientIndex + clientsPerCoach);

    for (const client of assignedClients) {
      // Assign coach to client
      await prisma.client.update({
        where: { id: client.id },
        data: { coachId: coach.id },
      });

      // Create a Program
      const program = await prisma.program.create({
        data: {
          name: `Program for ${client.id}`,
          description: 'Auto-generated training program',
          isPublic: false,
          createdById: coach.userId,
        },
      });

      // Create a ClientProgram linking client, coach, and program
      const clientProgram = await prisma.clientProgram.create({
        data: {
          clientId: client.id,
          programId: program.id,
          coachId: coach.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 4 weeks later
          status: 'active',
        },
      });

      // Create a TrainingBlock
      const trainingBlock = await prisma.trainingBlock.create({
        data: {
          description: `Block for ${client.id}`,
          programId: program.id,
          createdById: coach.userId,
        },
      });

      // Create 4 TrainingWeeks
      for (let weekNum = 1; weekNum <= 4; weekNum++) {
        const trainingWeek = await prisma.trainingWeek.create({
          data: {
            number: weekNum,
            blockId: trainingBlock.id,
            createdById: coach.userId,
          },
        });

        // Create 4 Trainings per week
        for (let t = 1; t <= 4; t++) {
          const training = await prisma.training.create({
            data: {
              date: new Date(Date.now() + ((weekNum - 1) * 7 + t - 1) * 24 * 60 * 60 * 1000),
              weekId: trainingWeek.id,
              createdById: coach.userId,
            },
          });

          // Pick 4 random exercises for this training
          const shuffled = exercises.sort(() => 0.5 - Math.random());
          const selectedExercises = shuffled.slice(0, 4);

          for (let e = 0; e < 4; e++) {
            const trainingExercise = await prisma.trainingExercise.create({
              data: {
                trainingId: training.id,
                exerciseId: selectedExercises[e].id,
                sortOrder: e + 1,
                sets: 3,
                reps: 10,
                weight: 50 + Math.floor(Math.random() * 50), // random weight
                createdById: coach.userId,
                volumeId: 0,
              },
            });
            const volume = await prisma.volume.create({
              data: {
                trainingExerciseId: trainingExercise.id,
                volumeTotal:
                  trainingExercise.sets * trainingExercise.reps * trainingExercise.weight,
                createdById: coach.userId,
              },
            });
            await prisma.trainingExercise.update({
              where: { id: trainingExercise.id },
              data: { volumeId: volume.id },
            });
          }
        }
      }
    }

    clientIndex += clientsPerCoach;
    if (clientIndex >= clients.length) {
      clientIndex = 0;
    }
  }

  console.log('✅ Assigned clients to coaches and seeded training programs.');
}
