const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Main seed function
async function main() {
  console.log("🌱 Starting DB Seed...");

  // Create Admin User
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

  ];

  for (const mod of modules) {
    await prisma.module.upsert({
      where: { key: mod.key },
      update: {},
      create: mod,
    });
  }

  console.log("✅ Modules seeded");

  // Assign all modules to admin
  const allModules = await prisma.module.findMany();
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

  // Create Company Master (Bank Details)
  const companyMasters = [
    {
      companyName: "YIWU ZHOULAI TRADING CO., LIMITED",
      companyAddress:
        "Add.: Room 801, Unit 3, Building 1, Jiuheyuan, Jiangdong Street, Yiwu City, Jinhua City, Zhejiang Province Tel.:13735751445",
      companyPhone: "13735751445",
      companyEmail: "sales@yiwuzhou.com",
      bankName: "ZHEJIANG TAILONG COMMERCIAL BANK",
      beneficiaryName: "YIWU ZHOULAI TRADING CO.,LIMITED",
      swiftBic: "ZJTLCNBHXXX",
      bankAddress:
        "ROOM 801, UNIT 3, BUILDING 1, JIUHEYUAN, JIANGDONG STREET, YIWU CITY, JINHUA CITY, ZHEJIANG PROVINCE",
      accountNumber: "33080020201000155179",
      signatureText: "Authorized Signatory",
    },
    {
      companyName: "SHANGHAI GLOBAL TRADING LTD",
      companyAddress:
        "Room 1208, No. 888, Pudong Avenue, Shanghai, China Tel.: +86-21-58881234",
      companyPhone: "+86-21-58881234",
      companyEmail: "info@shanghaiglobal.com",
      bankName: "INDUSTRIAL AND COMMERCIAL BANK OF CHINA",
      beneficiaryName: "SHANGHAI GLOBAL TRADING LTD",
      swiftBic: "ICBKCNBJSHI",
      bankAddress:
        "NO.1 FUCHENGMENTOU STREET, XICHENG DISTRICT, BEIJING 100140, CHINA",
      accountNumber: "4567890123456789",
      signatureText: "Director",
    },
    {
      companyName: "GUANGDONG IMPORT EXPORT CORP",
      companyAddress:
        "Floor 15, Tianhe Plaza, Tianhe District, Guangzhou, Guangdong, China Tel.: +86-20-85551234",
      companyPhone: "+86-20-85551234",
      companyEmail: "export@guangdongcorp.com",
      bankName: "BANK OF CHINA",
      beneficiaryName: "GUANGDONG IMPORT EXPORT CORPORATION",
      swiftBic: "BKCHCNBJGDG",
      bankAddress: "NO.1 FU XING MEN NEI DA JIE, BEIJING 100818, CHINA",
      accountNumber: "9876543210123456",
      signatureText: "General Manager",
    },
  ];

  for (const company of companyMasters) {
    await prisma.companyMaster.upsert({
      where: { companyName: company.companyName },
      update: {},
      create: company,
    });
  }

  console.log("✅ Company Masters seeded");

  // Create default shipping marks
  const shippingMarks = [
    { name: "BB-AMD", source: "RAJ" },
    { name: "SMW-INK", source: "YIWU" },
    { name: "RMSZ-M", source: "GUANGZHOU" },
    { name: "EXPRESS", source: "SHENZHEN" },
    { name: "JB-210", source: "NINGBO" },
  ];

  for (const mark of shippingMarks) {
    await prisma.shippingMark.upsert({
      where: { name: mark.name },
      update: {},
      create: mark,
    });
  }

  console.log("✅ Shipping Marks seeded");

  // Create default CTN marks
  const ctnMarks = [
    { name: "EXPRESS" },
    { name: "JB-210-211-212-213" },
    { name: "SMW-001" },
    { name: "BB-001" },
    { name: "RMSZ-001" },
  ];

  for (const mark of ctnMarks) {
    await prisma.ctnMark.upsert({
      where: { name: mark.name },
      update: {},
      create: mark,
    });
  }

  console.log("✅ CTN Marks seeded");

  // Create demo container
  const demoContainer = await prisma.container.upsert({
    where: { containerCode: "PSDH-86" },
    update: {},
    create: {
      containerCode: "PSDH-86",
      origin: "YIWU",
    },
  });

  console.log("✅ Demo container created:", demoContainer.containerCode);
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
