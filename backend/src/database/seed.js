const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting DB Seed...");

  const adminPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      name: "System Admin",
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("✅ Admin created:", admin.username);

  const modules = [
    { key: "LOADING_SHEET", name: "Loading Sheet" },
    { key: "ACCOUNTS", name: "Accounts" },
    { key: "CONTAINERS", name: "Container Overview" },
  ];

  for (const mod of modules) {
    await prisma.module.upsert({
      where: { key: mod.key },
      update: {},
      create: mod,
    });
  }

  console.log("✅ Modules seeded");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
