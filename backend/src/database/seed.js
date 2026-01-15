const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Main seed function
async function main() {
  console.log("🌱 Starting DB Seed...");

  // Create Super User (protected - cannot be deleted/deactivated/modified)
  const superPassword = await bcrypt.hash("super@admin123", 10);

  const superUser = await prisma.user.upsert({
    where: { username: "superadmin" },
    update: {
      isSuper: true, // Ensure existing user gets isSuper flag
    },
    create: {
      username: "superadmin",
      password: superPassword,
      name: "Super Admin",
      role: "ADMIN",
      isActive: true,
      isSuper: true, // This user is protected
    },
  });

  console.log("✅ Super Admin created:", superUser.username);

  // Create Regular Admin User
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
      isSuper: false,
    },
  });

  console.log("✅ Admin created:", admin.username);

  // Create Modules (including task management module)
  const modules = [
    { key: "DASHBOARD", name: "Dashboard" },
    { key: "ORDER_TRACKER", name: "Order Tracker" },
    { key: "LOADING_SHEET", name: "Loading Sheet" },
    { key: "BIFURCATION", name: "Bifurcation" },
    { key: "PACKING_LIST", name: "Packing List" },
    { key: "INVOICE", name: "Invoice" },
    { key: "CONTAINERS", name: "Containers" },
    { key: "CONTAINER_SUMMARY", name: "Container Summary" },
    { key: "CONTAINERS_LIST", name: "Containers List" },
    { key: "WAREHOUSE_PLAN", name: "Warehouse Plan" },
    { key: "ACCOUNTS", name: "Accounts" },
    { key: "CLIENTS", name: "Clients" },
    { key: "EXPENSES", name: "Expenses" },
    { key: "USER_MANAGEMENT", name: "User Management" },
    { key: "TASK_MANAGEMENT", name: "Task Management" },
    { key: "MY_TASK", name: "My Tasks" },
    { key: "BACKUPS", name: "System Backups" },
    { key: "PROFILE", name: "PROFILE" },
    { key: "SETTINGS", name: "Settings" },
  ];

  for (const mod of modules) {
    await prisma.module.upsert({
      where: { key: mod.key },
      update: {},
      create: mod,
    });
  }

  console.log("✅ Modules seeded");

  // Assign all modules to super admin
  const allModules = await prisma.module.findMany();
  for (const mod of allModules) {
    await prisma.userPermission.upsert({
      where: {
        userId_moduleId: {
          userId: superUser.id,
          moduleId: mod.id,
        },
      },
      update: {},
      create: {
        userId: superUser.id,
        moduleId: mod.id,
      },
    });
  }

  console.log("✅ Super Admin permissions assigned");

  // Assign all modules to regular admin
  for (const mod of allModules) {
    await prisma.userPermission.upsert({
      where: {
        userId_moduleId: {
          userId: admin.id,
          moduleId: mod.id,
        },
      },
      update: {},
      create: {
        userId: admin.id,
        moduleId: mod.id,
      },
    });
  }

  console.log("✅ Admin permissions assigned");

  // Create default system settings
  const defaultSettings = [
    {
      key: "BIFURCATION_ITEM_LIMIT",
      value: "5",
      description: "Product layout limit for bifurcation reports. Descriptions collapse to 'MIX ITEM' for marks exceeding this limit.",
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log("✅ Default settings seeded");
  console.log("🌱 Database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
