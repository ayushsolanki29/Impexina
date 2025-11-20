const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting DB Seed...");
  const NUM_RECORDS = 10;

  // ----------------------------
  // 1️⃣ CREATE DEFAULT ADMIN USER (Required for foreign keys)
  // ----------------------------
  const adminPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // ----------------------------
  // 2️⃣ CREATE 10 CLIENTS 🧑‍🤝‍🧑
  // ----------------------------
  console.log(`\nCreating ${NUM_RECORDS} Clients...`);
  const clientData = [];
  for (let i = 1; i <= NUM_RECORDS; i++) {
    clientData.push({
      name: `Client Name ${i}`,
      email: `client${i}@example.com`,
      phone: `99000000${i.toString().padStart(2, '0')}`,
      company: `Client Company ${i} Ltd`,
      city: i % 2 === 0 ? "Ahmedabad" : "Surat",
      state: "Gujarat",
      pincode: `38000${(i % 5) + 1}`,
    });
  }

  await prisma.client.createMany({ data: clientData });
  const clients = await prisma.client.findMany(); // Fetch all created clients
  const client1 = clients[0]; // Use the first client for relations

  // ----------------------------
  // 3️⃣ CREATE 10 LOADING SHEETS + ITEMS 🚢
  // ----------------------------
  console.log(`Creating ${NUM_RECORDS} Loading Sheets...`);
  const loadingSheets = [];
  for (let i = 1; i <= NUM_RECORDS; i++) {
    const sheet = await prisma.loadingSheet.create({
      data: {
        shippingCode: `SHIP${(100 + i).toString()}`,
        shippingMark: `MARK-${i}`,
        supplier: i % 2 === 0 ? "China Supplier" : "Korea Supplier",
        loadingDate: new Date(new Date().setDate(new Date().getDate() - i)),
        // FIX: Replaced "DELIVERED" with valid enum value "COMPLETED"
        status: i % 3 === 0 ? "COMPLETED" : "IN_TRANSIT",
        items: {
          create: [
            {
              itemName: `Product A-${i}`,
              ctn: i * 2,
              pcs: i * 20,
              cbm: i * 0.5,
              weight: i * 50,
              unitPrice: 100 + i * 10,
              totalPrice: (100 + i * 10) * (i * 20),
            },
            {
              itemName: `Product B-${i}`,
              ctn: i * 1,
              pcs: i * 10,
              cbm: i * 0.2,
              weight: i * 20,
              unitPrice: 50 + i * 5,
              totalPrice: (50 + i * 5) * (i * 10),
            },
          ],
        },
      },
      include: { items: true },
    });
    loadingSheets.push(sheet);
  }

  // ----------------------------
  // 4️⃣ CREATE 10 WAREHOUSE ITEMS (one for each Loading Sheet) 📦
  // ----------------------------
  console.log(`Creating ${NUM_RECORDS} Warehouse Items...`);
  const warehouseItems = [];
  for (let i = 0; i < NUM_RECORDS; i++) {
    const loadingSheet = loadingSheets[i];
    const warehouseItem = await prisma.warehouseItem.create({
      data: {
        itemName: loadingSheet.items[0].itemName, // Use the name from the first item
        quantity: loadingSheet.items[0].pcs,
        ctn: loadingSheet.items[0].ctn,
        cbm: loadingSheet.items[0].cbm,
        weight: loadingSheet.items[0].weight,
        loadingSheetId: loadingSheet.id,
      },
    });
    warehouseItems.push(warehouseItem);
  }
  const warehouseItem1 = warehouseItems[0]; // Use the first warehouse item for relations

  // ----------------------------
  // 5️⃣ CREATE 10 STOCK MOVEMENTS (Inbound) 📈
  // ----------------------------
  console.log(`Creating ${NUM_RECORDS} Stock Movements...`);
  const stockMovementData = [];
  for (let i = 0; i < NUM_RECORDS; i++) {
    const item = warehouseItems[i];
    stockMovementData.push({
      itemId: item.id,
      quantity: item.quantity,
      movementType: "INWARD",
      previousQuantity: 0,
      newQuantity: item.quantity,
      userId: admin.id,
      notes: `Initial stock for ${item.itemName}`,
    });
  }
  await prisma.stockMovement.createMany({ data: stockMovementData });


  // ----------------------------
  // 6️⃣ CREATE 10 DUTY PAYMENTS (one for each Loading Sheet) 💰
  // ----------------------------
  console.log(`Creating ${NUM_RECORDS} Duty Payments...`);
  const dutyPaymentData = [];
  for (let i = 0; i < NUM_RECORDS; i++) {
    const loadingSheet = loadingSheets[i];
    const dutyAmount = 10000 + i * 500;
    const taxAmount = dutyAmount * 0.18;
    dutyPaymentData.push({
      loadingSheetId: loadingSheet.id,
      dutyAmount: dutyAmount,
      taxAmount: taxAmount,
      totalAmount: dutyAmount + taxAmount,
      notes: `Duty Paid for loading sheet ${loadingSheet.shippingCode}`,
    });
  }
  await prisma.dutyPayment.createMany({ data: dutyPaymentData });

  // ----------------------------
  // 7️⃣ CREATE 10 INVOICES + ITEMS 🧾
  // ----------------------------
  console.log(`Creating ${NUM_RECORDS} Invoices...`);
  const invoices = [];
  for (let i = 1; i <= NUM_RECORDS; i++) {
    const subtotal = 10000 + i * 1000;
    const gstAmount = subtotal * 0.18;
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: `INV-100${i.toString()}`,
        clientId: clients[i % clients.length].id, // Cycle through clients
        createdById: admin.id,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        subtotal: subtotal,
        gstAmount: gstAmount,
        totalAmount: subtotal + gstAmount,
        items: {
          create: [
            {
              itemName: `Invoiced Item ${i}`,
              quantity: i * 5,
              unitPrice: 200 + i * 20,
              totalPrice: subtotal,
              gstRate: 18,
            },
          ],
        },
      },
    });
    invoices.push(invoice);
  }
  const invoice1 = invoices[0]; // Use the first invoice for relations

  // ----------------------------
  // 8️⃣ CREATE 10 LEDGER ENTRIES (one for each Invoice) 📒
  // ----------------------------
  console.log(`Creating ${NUM_RECORDS} Ledger Entries...`);
  const ledgerEntryData = [];
  let currentBalance = 0;
  for (let i = 0; i < NUM_RECORDS; i++) {
    const invoice = invoices[i];
    // Add the total amount of the invoice to the running balance
    currentBalance += parseFloat(invoice.totalAmount); 

    ledgerEntryData.push({
      clientId: invoice.clientId,
      invoiceId: invoice.id,
      type: "INVOICE",
      amount: invoice.totalAmount,
      description: `Invoice ${invoice.invoiceNo} created`,
      balance: currentBalance,
    });
  }
  await prisma.ledgerEntry.createMany({ data: ledgerEntryData });

  // ----------------------------
  // 9️⃣ CREATE 10 EXPENSES 💸
  // ----------------------------
  console.log(`Creating ${NUM_RECORDS} Expenses...`);
  const expenseData = [];
  const categories = ["Transport", "Customs Fees", "Office Supplies", "Salaries"];
  const paymentModes = ["CASH", "BANK_TRANSFER", "UPI"];
  for (let i = 1; i <= NUM_RECORDS; i++) {
    expenseData.push({
      category: categories[i % categories.length],
      description: `Expense record ${i}`,
      amount: 1000 + i * 500,
      expenseDate: new Date(new Date().setDate(new Date().getDate() - i * 3)),
      paymentMode: paymentModes[i % paymentModes.length],
      createdById: admin.id,
    });
  }
  await prisma.expense.createMany({ data: expenseData });

  // ----------------------------
  // 🔟 CREATE 10 BIFURCATION + ITEMS ✂️
  // ----------------------------
  console.log(`Creating ${NUM_RECORDS} Bifurcations...`);
  const bifurcations = [];
  for (let i = 1; i <= NUM_RECORDS; i++) {
    const bifurcation = await prisma.bifurcation.create({
      data: {
        name: `BIF-00${i.toString()}`,
        description: `Allocation for client ${clients[i % clients.length].name}`,
        items: {
          create: [
            {
              warehouseItemId: warehouseItems[i % warehouseItems.length].id, // Cycle through warehouse items
              clientId: clients[i % clients.length].id, // Cycle through clients
              allocatedQuantity: i * 2,
              notes: `Bifurcation item ${i}`,
            },
          ],
        },
      },
      include: { items: true },
    });
    bifurcations.push(bifurcation);
  }

  // ----------------------------
  // 1️⃣1️⃣ SYSTEM SETTINGS (Fixed number) ⚙️
  // ----------------------------
  console.log("Creating System Settings...");
  await prisma.systemSetting.createMany({
    data: [
      { key: "company_name", value: "Solanki Imports", type: "STRING" },
      { key: "gst_rate", value: "18", type: "NUMBER" },
      { key: "theme_dark_mode", value: "true", type: "BOOLEAN" },
    ],
    skipDuplicates: true,
  });

  // ----------------------------
  // 1️⃣2️⃣ CREATE 10 WHATSAPP LOGS (one for each Invoice) 📱
  // ----------------------------
  console.log(`Creating ${NUM_RECORDS} WhatsApp Logs...`);
  const whatsAppLogData = [];
  for (let i = 0; i < NUM_RECORDS; i++) {
    const invoice = invoices[i];
    whatsAppLogData.push({
      clientId: invoice.clientId,
      invoiceId: invoice.id,
      messageType: "INVOICE",
      message: `Dear Client, Your invoice ${invoice.invoiceNo} has been generated.`,
      status: i % 4 === 0 ? "FAILED" : "SENT",
    });
  }
  await prisma.whatsAppLog.createMany({ data: whatsAppLogData });

  console.log(`\n✅ Seed completed successfully! Created ${NUM_RECORDS} records for most models.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });