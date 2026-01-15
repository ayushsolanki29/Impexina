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


  // Create default system settings
  const defaultSettings = [
    {
      key: "BIFURCATION_ITEM_LIMIT",
      value: "5",
      description: "Product layout limit for bifurcation reports. Descriptions collapse to 'MIX ITEM' for marks exceeding this limit.",
    },
    {
      key: "TASK_COMPLETION_MIN_CHARS",
      value: "30",
      description: "Minimum number of characters required for task completion notes.",
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

  // Create Task Templates based on common business operations
  const taskTemplates = [
    // DAILY TASKS
    { title: "CHINA LOADING PLAN", category: "LOGISTICS", defaultSchedule: "DAILY", description: "Review and update China loading plan" },
    { title: "CHINA ORDER PLAN & PAYMENT", category: "FINANCE", defaultSchedule: "DAILY", description: "Handle China order planning and payment processing" },
    { title: "LOADING SHEET - FINAL AND SENDING", category: "OPERATIONS", defaultSchedule: "DAILY", description: "Finalize and send loading sheets" },
    { title: "WAREHOUSE DELIVERY & DISPATCH", category: "WAREHOUSE", defaultSchedule: "DAILY", description: "Manage warehouse deliveries and dispatch" },
    { title: "BOE PURCHASE IN TALLY", category: "ACCOUNTING", defaultSchedule: "DAILY", description: "Record BOE purchases in Tally" },
    { title: "EVERYDAY PURCHASE", category: "PURCHASING", defaultSchedule: "DAILY", description: "Handle everyday purchasing activities" },
    { title: "LEDGER PRINT", category: "ACCOUNTING", defaultSchedule: "DAILY", description: "Print and verify ledger entries" },
    { title: "INSTAGRAM & FACEBOOK", category: "MARKETING", defaultSchedule: "DAILY", description: "Manage social media posts and engagement" },
    
    // WEEKLY TASKS
    { title: "TALLY AC OVERVIEW", category: "ACCOUNTING", defaultSchedule: "WEEKLY", description: "Weekly review of Tally account overview" },
    { title: "NEW CLIENT ACQUISITION", category: "SALES", defaultSchedule: "WEEKLY", description: "Focus on acquiring new clients" },
    { title: "CLIENT CLOSING", category: "SALES", defaultSchedule: "WEEKLY", description: "Follow up on pending client closings" },
    { title: "PAYMENT COLLECTION - SECOND DAY", category: "FINANCE", defaultSchedule: "WEEKLY", description: "Collect pending payments" },
    { title: "NEW PRODUCT RESEARCH", category: "RESEARCH", defaultSchedule: "WEEKLY", description: "Research new product opportunities" },
    { title: "USD DOLLAR", category: "FINANCE", defaultSchedule: "WEEKLY", description: "Monitor and manage USD transactions" },
    { title: "ALIBABA", category: "SOURCING", defaultSchedule: "WEEKLY", description: "Check Alibaba for new suppliers and products" },
    
    // MONTHLY TASKS
    { title: "MONTHLY LEDGER CHECKING", category: "ACCOUNTING", defaultSchedule: "MONTHLY", description: "Monthly verification of ledger entries" },
    { title: "GST INVOICE CONFIRMATION", category: "ACCOUNTING", defaultSchedule: "MONTHLY", description: "Confirm and verify GST invoices" },
    { title: "IMPORT DOCUMENT CHECK", category: "DOCUMENTATION", defaultSchedule: "MONTHLY", description: "Verify import documentation" },
    { title: "GST PURCHASE", category: "ACCOUNTING", defaultSchedule: "MONTHLY", description: "Handle GST purchase entries" },
    { title: "BANKING 3 COMPANY", category: "BANKING", defaultSchedule: "MONTHLY", description: "Manage banking for all 3 companies" },
    { title: "PURCHASE BILL", category: "ACCOUNTING", defaultSchedule: "MONTHLY", description: "Process purchase bills" },
    { title: "PURCHASE BILL HARDPRINT", category: "ACCOUNTING", defaultSchedule: "MONTHLY", description: "Print and file purchase bills" },
    { title: "MUMBAI OFFICE EXPENSE SHEET CHECK", category: "EXPENSE", defaultSchedule: "MONTHLY", description: "Review Mumbai office expense sheets" },
    
    // AS PER REQUIREMENT
    { title: "CONTAINER TRACKING", category: "LOGISTICS", defaultSchedule: "AS_PER_REQUIREMENT", description: "Track container movements as needed" },
    { title: "CLIENT AC", category: "ACCOUNTING", defaultSchedule: "AS_PER_REQUIREMENT", description: "Handle client account matters" },
    { title: "BANK PAYMENT", category: "FINANCE", defaultSchedule: "AS_PER_REQUIREMENT", description: "Process bank payments as needed" },
    { title: "DUTY PAYMENT", category: "CUSTOMS", defaultSchedule: "AS_PER_REQUIREMENT", description: "Handle duty payments for shipments" },
    { title: "INVOICE PRINTING (AT TIME OF E INVOICE)", category: "DOCUMENTATION", defaultSchedule: "AS_PER_REQUIREMENT", description: "Print invoices when e-invoice is generated" },
    { title: "IMPORT DOCUMENT CHECK", category: "DOCUMENTATION", defaultSchedule: "AS_PER_REQUIREMENT", description: "Check import documents as required" },
    { title: "INVOICE DRAFT CONFIRMATION", category: "DOCUMENTATION", defaultSchedule: "AS_PER_REQUIREMENT", description: "Confirm draft invoices before finalization" },
    { title: "TRANSPORT INVOICE", category: "LOGISTICS", defaultSchedule: "AS_PER_REQUIREMENT", description: "Handle transport invoice processing" },
    { title: "LR COPY SHARE WITH CLIENT", category: "DOCUMENTATION", defaultSchedule: "AS_PER_REQUIREMENT", description: "Share LR copies with clients" },
    { title: "INVOICE DRAFT (COMMERCIAL WITH CLIENT)", category: "DOCUMENTATION", defaultSchedule: "AS_PER_REQUIREMENT", description: "Prepare commercial invoice drafts" },
    { title: "BOOK KEEPING FOLLOW UP WITH CA", category: "ACCOUNTING", defaultSchedule: "AS_PER_REQUIREMENT", description: "Follow up with CA on bookkeeping matters" },
    { title: "SOFTWARE FOLLOW UP", category: "IT", defaultSchedule: "AS_PER_REQUIREMENT", description: "Follow up on software-related issues" },
  ];

  // Create task templates
  for (const template of taskTemplates) {
    await prisma.taskTemplate.upsert({
      where: {
        id: `template-${template.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      },
      update: {},
      create: {
        id: `template-${template.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        title: template.title,
        description: template.description,
        category: template.category,
        defaultSchedule: template.defaultSchedule,
        isSystemTemplate: true,
        isActive: true,
        createdById: superUser.id,
      },
    });
  }

  console.log("✅ Task templates seeded");
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
