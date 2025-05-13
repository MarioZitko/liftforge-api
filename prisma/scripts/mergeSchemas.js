const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../schema.prisma');
const modelsDir = path.join(__dirname, '../models');

const datasourceAndGenerator = `
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
`;

// Truncate the schema file first
fs.truncateSync(schemaPath, 0);

// Then read the model files and write to the schema file
const modelFiles = fs.readdirSync(modelsDir).filter((file) => file.endsWith('.prisma'));

const models = modelFiles
  .map((file) => fs.readFileSync(path.join(modelsDir, file), 'utf-8'))
  .join('\n\n');

// Write the new content to the schema file
fs.writeFileSync(schemaPath, `${datasourceAndGenerator}\n\n${models}`, {
  flag: 'w',
});

console.log('✅ Prisma schema merged successfully.');
