const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

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

  // Create Modules
  const modules = [
    { key: "LOADING_SHEET", name: "Loading Sheet" },
    { key: "ACCOUNTS", name: "Accounts" },
    { key: "CONTAINERS", name: "Container Overview" },
    { key: "BIFURCATION", name: "Bifurcation" },
    { key: "PACKING_LIST", name: "Packing List" },
    { key: "COMPANY_MASTER", name: "Company Master" },
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
      companyAddress: "Add.: Room 801, Unit 3, Building 1, Jiuheyuan, Jiangdong Street, Yiwu City, Jinhua City, Zhejiang Province Tel.:13735751445",
      companyPhone: "13735751445",
      companyEmail: "sales@yiwuzhou.com",
      bankName: "ZHEJIANG TAILONG COMMERCIAL BANK",
      beneficiaryName: "YIWU ZHOULAI TRADING CO.,LIMITED",
      swiftBic: "ZJTLCNBHXXX",
      bankAddress: "ROOM 801, UNIT 3, BUILDING 1, JIUHEYUAN, JIANGDONG STREET, YIWU CITY, JINHUA CITY, ZHEJIANG PROVINCE",
      accountNumber: "33080020201000155179",
      signatureText: "Authorized Signatory",
    },
    {
      companyName: "SHANGHAI GLOBAL TRADING LTD",
      companyAddress: "Room 1208, No. 888, Pudong Avenue, Shanghai, China Tel.: +86-21-58881234",
      companyPhone: "+86-21-58881234",
      companyEmail: "info@shanghaiglobal.com",
      bankName: "INDUSTRIAL AND COMMERCIAL BANK OF CHINA",
      beneficiaryName: "SHANGHAI GLOBAL TRADING LTD",
      swiftBic: "ICBKCNBJSHI",
      bankAddress: "NO.1 FUCHENGMENTOU STREET, XICHENG DISTRICT, BEIJING 100140, CHINA",
      accountNumber: "4567890123456789",
      signatureText: "Director",
    },
    {
      companyName: "GUANGDONG IMPORT EXPORT CORP",
      companyAddress: "Floor 15, Tianhe Plaza, Tianhe District, Guangzhou, Guangdong, China Tel.: +86-20-85551234",
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

  // Create demo employee
  const employeePassword = await bcrypt.hash("emp123", 10);
  
  const employee = await prisma.user.upsert({
    where: { username: "employee" },
    update: {},
    create: {
      username: "employee",
      password: employeePassword,
      name: "John Employee",
      role: "EMPLOYEE",
      isActive: true,
    },
  });

  console.log("✅ Employee created:", employee.username);

  // Assign limited modules to employee
  const employeeModules = await prisma.module.findMany({
    where: {
      key: {
        in: ["LOADING_SHEET", "CONTAINERS", "PACKING_LIST"],
      },
    },
  });

  for (const mod of employeeModules) {
    await prisma.userPermission.upsert({
      where: {
        userId_moduleId: {
          userId: employee.id,
          moduleId: mod.id,
        },
      },
      update: {},
      create: {
        userId: employee.id,
        moduleId: mod.id,
      },
    });
  }

  console.log("✅ Employee permissions assigned");

  console.log("🎉 Database seeding completed successfully!");
  console.log("\n📋 Default Login Credentials:");
  console.log("   Admin:     admin / admin123");
  console.log("   Employee:  employee / emp123");
  console.log("\n📦 Demo Container: PSDH-86");
  console.log("🏢 Company Masters: 3 companies with bank details");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });