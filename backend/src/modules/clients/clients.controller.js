const clientsService = require("./clients.service");

const clientsController = {
  // Get all clients/leads with filtering
  getAllClients: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search = "", 
        type = "", 
        status = "",
        city = "",
        sortBy = "createdAt",
        sortOrder = "desc"
      } = req.query;
      
      const result = await clientsService.getAllClients({
        page,
        limit,
        search,
        type,
        status,
        city,
        sortBy,
        sortOrder,
      });
      
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Get client/lead by ID
  getClientById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const client = await clientsService.getClientById(id);
      
      res.status(200).json({
        success: true,
        data: client,
      });
    } catch (error) {
      if (error.message === "Client not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Create new client/lead
  createClient: async (req, res) => {
    try {
      const clientData = req.body;
      const userId = req.user.id;
      const userName = req.user.name;
      
      const client = await clientsService.createClient(clientData, userId, userName);
      
      res.status(201).json({
        success: true,
        message: "Client/Lead created successfully",
        data: client,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Update client/lead
  updateClient: async (req, res) => {
    try {
      const { id } = req.params;
      const clientData = req.body;
      const userId = req.user.id;
      const userName = req.user.name;
      
      const client = await clientsService.updateClient(id, clientData, userId, userName);
      
      res.status(200).json({
        success: true,
        message: "Client/Lead updated successfully",
        data: client,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Delete client/lead
  deleteClient: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userName = req.user.name;
      
      const result = await clientsService.deleteClient(id, userId, userName);
      
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Convert lead to client
  convertLeadToClient: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userName = req.user.name;
      
      const client = await clientsService.convertLeadToClient(id, userId, userName);
      
      res.status(200).json({
        success: true,
        message: "Lead converted to client successfully",
        data: client,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Update client status
  updateClientStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;
      const userName = req.user.name;
      
      const client = await clientsService.updateClientStatus(id, status, userId, userName);
      
      res.status(200).json({
        success: true,
        message: "Status updated successfully",
        data: client,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Get client activities
  getClientActivities: async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const activities = await clientsService.getClientActivities(id, { page, limit });
      
      res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Add client activity
  addClientActivity: async (req, res) => {
    try {
      const { id } = req.params;
      const activityData = req.body;
      const userId = req.user.id;
      const userName = req.user.name;
      
      const activity = await clientsService.addClientActivity(
        id,
        activityData,
        userId,
        userName
      );
      
      res.status(201).json({
        success: true,
        message: "Activity added successfully",
        data: activity,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Get dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      const stats = await clientsService.getDashboardStats();
      
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Bulk update clients
  bulkUpdateClients: async (req, res) => {
    try {
      const { ids, updates } = req.body;
      const userId = req.user.id;
      const userName = req.user.name;
      
      const result = await clientsService.bulkUpdateClients(ids, updates, userId, userName);
      
      res.status(200).json({
        success: true,
        message: "Clients updated successfully",
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Search suggestions
  searchSuggestions: async (req, res) => {
    try {
      const { search = "", type = "", limit = 10 } = req.query;
      
      const suggestions = await clientsService.searchSuggestions(search, type, limit);
      
      res.status(200).json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Export clients to Excel
  exportClients: async (req, res) => {
    try {
      const { 
        type = "", 
        status = "", 
        city = "",
        startDate,
        endDate
      } = req.query;
      
      const XLSX = require("xlsx");
      
      // Get clients data
      const { clients } = await clientsService.getAllClients({
        page: 1,
        limit: 10000,
        search: "",
        type,
        status,
        city,
      });
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Clients sheet
      const clientsData = clients.map((client, index) => ({
        "S.No": index + 1,
        "Name": client.name,
        "Company": client.companyName || "",
        "Contact Person": client.contactPerson || "",
        "Email": client.email || "",
        "Phone": client.phone || "",
        "Mobile": client.mobile || "",
        "City": client.city || "",
        "State": client.state || "",
        "Address": client.address || "",
        "Type": client.type,
        "Status": client.status,
        "GST": client.gstNumber || "",
        "Industry": client.industry || "",
        "Credit Limit": client.creditLimit || 0,
        "Source": client.source || "",
        "Rating": client.rating || 0,
        "Notes": client.notes || "",
        "Tags": client.tags?.join(", ") || "",
        "Last Contacted": client.lastContactedAt ? new Date(client.lastContactedAt).toLocaleDateString() : "",
        "Next Follow Up": client.nextFollowUpAt ? new Date(client.nextFollowUpAt).toLocaleDateString() : "",
        "Created": new Date(client.createdAt).toLocaleDateString(),
        "Updated": new Date(client.updatedAt).toLocaleDateString(),
      }));
      
      const clientsSheet = XLSX.utils.json_to_sheet(clientsData);
      XLSX.utils.book_append_sheet(workbook, clientsSheet, "Clients");
      
      // Summary sheet
      const stats = await clientsService.getDashboardStats();
      
      const summaryData = [
        {
          "Report Type": type ? `${type.toUpperCase()}s` : "All Clients & Leads",
          "Total Count": stats.totalClients,
          "Leads": stats.totalLeads,
          "Clients": stats.totalClients - stats.totalLeads,
          "Active": stats.activeClients,
          "New": stats.newClients,
          "Inactive": stats.inactiveClients,
          "Generated Date": new Date().toLocaleDateString(),
          "Generated By": req.user.name,
        },
      ];
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
      
      // Write to buffer
      const excelBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });
      
      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      
      const fileName = `crm_${type || "all"}_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${fileName}`
      );
      
      res.send(excelBuffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  
  // Get cities list
  getCities: async (req, res) => {
    try {
      const cities = await clientsService.getCities();
      
      res.status(200).json({
        success: true,
        data: cities,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = clientsController;