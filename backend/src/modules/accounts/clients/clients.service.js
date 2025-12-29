const { prisma } = require("../../../database/prisma");

const accountsService = {
  // Get all clients
  getAllClients: async ({ page = 1, limit = 20, search = "", location = "" }) => {
    try {
      const skip = (page - 1) * limit;
      
      const where = {
        isActive: true
      };
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      if (location) {
        where.location = { contains: location, mode: 'insensitive' };
      }
      
      const [clients, total] = await Promise.all([
        prisma.accountClient.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            containers: {
              select: {
                containerCode: true,
                mark: true,
              },
              take: 3,
            },
            _count: {
              select: { transactions: true },
            },
          },
          orderBy: [
            { balance: 'desc' },
            { updatedAt: 'desc' },
          ],
        }),
        prisma.accountClient.count({ where }),
      ]);
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        clients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      console.error("Error getting clients:", error);
      throw error;
    }
  },
  
  // Get client by ID
  getClientById: async (clientId) => {
    try {
      const client = await prisma.accountClient.findUnique({
        where: { id: clientId },
        include: {
          containers: {
            orderBy: { createdAt: 'desc' },
          },
          transactions: {
            orderBy: { transactionDate: 'desc' },
            take: 100,
          },
        },
      });
      
      if (!client) {
        throw new Error("Client not found");
      }
      
      return client;
    } catch (error) {
      console.error("Error getting client:", error);
      throw error;
    }
  },
  
  // Create new client - FIXED
  createClient: async (clientData, userId) => {
    try {
      const { name, location, phone, email, gst, pan } = clientData;
      
      // Check if client already exists
      const existingClient = await prisma.accountClient.findFirst({
        where: {
          name,
          location,
        },
      });
      
      if (existingClient) {
        throw new Error("Client with same name and location already exists");
      }
      
      const client = await prisma.accountClient.create({
        data: {
          name,
          location: location || null,
          phone: phone || null,
          email: email || null,
          gst: gst || null,
          pan: pan || null,
          lastActive: new Date(),
          createdBy: userId.toString(), // Store as string
        },
      });
      
      return client;
    } catch (error) {
      console.error("Error creating client:", error);
      throw error;
    }
  },
  
  // Update client - FIXED
  updateClient: async (clientId, clientData, userId) => {
    try {
      const client = await prisma.accountClient.update({
        where: { id: clientId },
        data: {
          ...clientData,
          updatedBy: userId.toString(), // Store as string
          updatedAt: new Date(),
        },
      });
      
      return client;
    } catch (error) {
      console.error("Error updating client:", error);
      throw error;
    }
  },
  
  // Delete client (soft delete)
  deleteClient: async (clientId, userId) => {
    try {
      // Check if client has transactions
      const transactionCount = await prisma.clientTransaction.count({
        where: { clientId },
      });
      
      if (transactionCount > 0) {
        // Soft delete
        const client = await prisma.accountClient.update({
          where: { id: clientId },
          data: {
            isActive: false,
            updatedBy: userId.toString(),
            updatedAt: new Date(),
          },
        });
        
        return {
          message: "Client deactivated (has transactions)",
          client,
        };
      } else {
        // Hard delete
        await prisma.accountClient.delete({
          where: { id: clientId },
        });
        
        return {
          message: "Client deleted successfully",
        };
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      throw error;
    }
  },
  
  // Get client ledger with transactions
  getClientLedger: async (clientId, { startDate, endDate, page = 1, limit = 50 }) => {
    try {
      const skip = (page - 1) * limit;
      
      const where = {
        clientId,
      };
      
      if (startDate && endDate) {
        where.transactionDate = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }
      
      const [transactions, total, client] = await Promise.all([
        prisma.clientTransaction.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: [
            { transactionDate: 'desc' },
            { createdAt: 'desc' },
          ],
        }),
        prisma.clientTransaction.count({ where }),
        prisma.accountClient.findUnique({
          where: { id: clientId },
          select: {
            id: true,
            name: true,
            location: true,
            balance: true,
            totalExpense: true,
            totalPaid: true,
          },
        }),
      ]);
      
      // Calculate running balance
      let runningBalance = 0;
      const transactionsWithBalance = transactions.map(t => {
        runningBalance += (t.amount - t.paid);
        return {
          ...t,
          runningBalance,
        };
      }).reverse();
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        client,
        transactions: transactionsWithBalance,
        summary: {
          totalTransactions: total,
          totalExpense: client.totalExpense,
          totalPaid: client.totalPaid,
          balance: client.balance,
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      console.error("Error getting ledger:", error);
      throw error;
    }
  },
  
  // Add transaction to client ledger - FIXED
  addTransaction: async (clientId, transactionData, userId) => {
    try {
      const {
        transactionDate,
        containerCode,
        containerMark,
        particulars,
        billingType,
        quantity,
        rate,
        amount,
        paid,
        paymentMode,
        paymentDate,
        paymentRef,
        fromAccount,
        toAccount,
        notes,
        type = 'EXPENSE',
      } = transactionData;
      
      // Calculate balance
      const balance = amount - (paid || 0);
      
      // Start transaction
      const result = await prisma.$transaction(async (prisma) => {
        // Create transaction
        const transaction = await prisma.clientTransaction.create({
          data: {
            clientId,
            transactionDate: new Date(transactionDate),
            containerCode: containerCode || null,
            containerMark: containerMark || null,
            particulars,
            billingType: billingType || 'flat',
            quantity: quantity ? parseFloat(quantity) : null,
            rate: rate ? parseFloat(rate) : null,
            amount: parseFloat(amount),
            paid: paid ? parseFloat(paid) : 0,
            balance,
            paymentMode: paymentMode || null,
            paymentDate: paymentDate ? new Date(paymentDate) : null,
            paymentRef: paymentRef || null,
            fromAccount: fromAccount || 'Main',
            toAccount: toAccount || 'Client',
            type,
            notes: notes || null,
            createdBy: userId.toString(), // Store as string
          },
        });
        
        // Update client balance
        const client = await prisma.accountClient.findUnique({
          where: { id: clientId },
        });
        
        let newTotalExpense = client.totalExpense;
        let newTotalPaid = client.totalPaid;
        
        if (type === 'EXPENSE') {
          newTotalExpense += parseFloat(amount);
        } else if (type === 'PAYMENT') {
          newTotalPaid += parseFloat(amount);
        }
        
        const newBalance = newTotalExpense - newTotalPaid;
        
        await prisma.accountClient.update({
          where: { id: clientId },
          data: {
            totalExpense: newTotalExpense,
            totalPaid: newTotalPaid,
            balance: newBalance,
            lastActive: new Date(),
            updatedBy: userId.toString(), // Store as string
            updatedAt: new Date(),
          },
        });
        
        return transaction;
      });
      
      return result;
    } catch (error) {
      console.error("Error adding transaction:", error);
      throw error;
    }
  },
  
  // Update transaction - FIXED
  updateTransaction: async (transactionId, transactionData, userId) => {
    try {
      const transaction = await prisma.$transaction(async (prisma) => {
        // Get old transaction
        const oldTransaction = await prisma.clientTransaction.findUnique({
          where: { id: transactionId },
        });
        
        if (!oldTransaction) {
          throw new Error("Transaction not found");
        }
        
        // Update transaction
        const updatedTransaction = await prisma.clientTransaction.update({
          where: { id: transactionId },
          data: {
            ...transactionData,
            updatedBy: userId.toString(), // Store as string
            updatedAt: new Date(),
          },
        });
        
        // Recalculate client balance
        const client = await prisma.accountClient.findUnique({
          where: { id: oldTransaction.clientId },
        });
        
        const allTransactions = await prisma.clientTransaction.findMany({
          where: { clientId: oldTransaction.clientId },
        });
        
        const newTotalExpense = allTransactions
          .filter(t => t.type === 'EXPENSE')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const newTotalPaid = allTransactions
          .reduce((sum, t) => sum + (t.paid || 0), 0);
        
        const newBalance = newTotalExpense - newTotalPaid;
        
        await prisma.accountClient.update({
          where: { id: oldTransaction.clientId },
          data: {
            totalExpense: newTotalExpense,
            totalPaid: newTotalPaid,
            balance: newBalance,
            updatedAt: new Date(),
          },
        });
        
        return updatedTransaction;
      });
      
      return transaction;
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  },
  
  // Delete transaction
  deleteTransaction: async (transactionId, userId) => {
    try {
      const result = await prisma.$transaction(async (prisma) => {
        // Get transaction
        const transaction = await prisma.clientTransaction.findUnique({
          where: { id: transactionId },
        });
        
        if (!transaction) {
          throw new Error("Transaction not found");
        }
        
        const clientId = transaction.clientId;
        
        // Delete transaction
        await prisma.clientTransaction.delete({
          where: { id: transactionId },
        });
        
        // Recalculate client balance
        const allTransactions = await prisma.clientTransaction.findMany({
          where: { clientId },
        });
        
        const newTotalExpense = allTransactions
          .filter(t => t.type === 'EXPENSE')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const newTotalPaid = allTransactions
          .reduce((sum, t) => sum + (t.paid || 0), 0);
        
        const newBalance = newTotalExpense - newTotalPaid;
        
        await prisma.accountClient.update({
          where: { id: clientId },
          data: {
            totalExpense: newTotalExpense,
            totalPaid: newTotalPaid,
            balance: newBalance,
            updatedAt: new Date(),
          },
        });
        
        return {
          message: "Transaction deleted successfully",
        };
      });
      
      return result;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  },
  
  // Get container suggestions from bifurcation
  getContainerSuggestions: async (search = "", limit = 10) => {
    try {
      const suggestions = await prisma.bifurcationContainer.findMany({
        where: {
          OR: [
            { containerCode: { contains: search, mode: 'insensitive' } },
            { origin: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: {
          containerCode: true,
          origin: true,
          loadingDate: true,
          totalCBM: true,
          totalWeight: true,
          clients: {
            select: {
              clientName: true,
              items: {
                select: {
                  particular: true,
                  cbm: true,
                  weight: true,
                },
                distinct: ['particular'],
                take: 5,
              },
            },
            take: 5,
          },
        },
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      });
      
      return suggestions;
    } catch (error) {
      console.error("Error getting container suggestions:", error);
      throw error;
    }
  },
  
  // Get client's linked containers
  getClientContainers: async (clientId) => {
    try {
      const containers = await prisma.clientContainerLink.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
      });
      
      return containers;
    } catch (error) {
      console.error("Error getting client containers:", error);
      throw error;
    }
  },
  
  // Link container to client
  linkContainerToClient: async (clientId, containerData, userId) => {
    try {
      const { containerCode, mark, totalCBM, totalWeight, ctn, product, deliveryDate, invNo, gstInv } = containerData;
      
      // Check if already linked
      const existingLink = await prisma.clientContainerLink.findFirst({
        where: {
          clientId,
          containerCode,
          mark,
        },
      });
      
      if (existingLink) {
        throw new Error("Container already linked to this client");
      }
      
      const link = await prisma.clientContainerLink.create({
        data: {
          clientId,
          containerCode,
          mark: mark || containerCode,
          totalCBM: parseFloat(totalCBM) || 0,
          totalWeight: parseFloat(totalWeight) || 0,
          ctn: parseInt(ctn) || 0,
          product: product || null,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          invNo: invNo || null,
          gstInv: gstInv || null,
        },
      });
      
      return link;
    } catch (error) {
      console.error("Error linking container:", error);
      throw error;
    }
  },
  
  // Unlink container from client
  unlinkContainerFromClient: async (linkId, userId) => {
    try {
      await prisma.clientContainerLink.delete({
        where: { id: linkId },
      });
      
      return {
        message: "Container unlinked successfully",
      };
    } catch (error) {
      console.error("Error unlinking container:", error);
      throw error;
    }
  },
  
  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const [
        totalClients,
        activeClients,
        totalReceivables,
        recentTransactions,
        topClients,
      ] = await Promise.all([
        prisma.accountClient.count({ where: { isActive: true } }),
        prisma.accountClient.count({
          where: {
            isActive: true,
            lastActive: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        prisma.accountClient.aggregate({
          where: { isActive: true },
          _sum: { balance: true },
        }),
        prisma.clientTransaction.count({
          where: {
            transactionDate: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        prisma.accountClient.findMany({
          where: { isActive: true },
          orderBy: { balance: 'desc' },
          take: 5,
          select: {
            name: true,
            location: true,
            balance: true,
            lastActive: true,
          },
        }),
      ]);
      
      return {
        totalClients,
        activeClients,
        totalReceivables: totalReceivables._sum.balance || 0,
        recentTransactions,
        topClients,
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      throw error;
    }
  },
  
  // Search clients and containers
  searchSuggestions: async (search = "", limit = 10) => {
    try {
      // Search clients
      const clients = await prisma.accountClient.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { location: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          location: true,
          phone: true,
          balance: true,
        },
        take: parseInt(limit),
      });
      
      // Search containers from bifurcation
      const containers = await prisma.bifurcationContainer.findMany({
        where: {
          containerCode: { contains: search, mode: 'insensitive' },
        },
        select: {
          containerCode: true,
          origin: true,
          loadingDate: true,
          clients: {
            select: {
              clientName: true,
              items: {
                select: {
                  particular: true,
                },
                distinct: ['particular'],
                take: 3,
              },
            },
          },
        },
        take: parseInt(limit / 2),
      });
      
      return {
        clients,
        containers: containers.map(container => ({
          containerCode: container.containerCode,
          origin: container.origin,
          loadingDate: container.loadingDate,
          clients: container.clients.map(client => ({
            name: client.clientName,
            items: client.items.map(item => item.particular),
          })),
        })),
      };
    } catch (error) {
      console.error("Error searching suggestions:", error);
      throw error;
    }
  },
};

module.exports = accountsService;