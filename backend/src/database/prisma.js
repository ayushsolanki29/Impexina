// src/database/prisma.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: ["error", "warn"], // avoid 'query' in production
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully (PostgreSQL)");
  } catch (error) {
    console.error("Database connection failed ❌");
    console.error(error);
    process.exit(1); // stop app if DB fails
  }
};

module.exports = { prisma, connectDB };
