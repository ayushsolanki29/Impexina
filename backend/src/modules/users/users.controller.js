const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const userController = {
  // Get all users with pagination and filters
  getAllUsers: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        role = '',
        status = ''
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Build where clause properly
      const whereConditions = [];

      // Add search condition if search is not empty
      if (search) {
        whereConditions.push({
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } }
          ]
        });
      }

      // Add role filter if selected
      if (role) {
        whereConditions.push({ role: role.toUpperCase() });
      }

      // Add status filter if selected
      if (status) {
        whereConditions.push({ isActive: status === 'active' });
      }

      // Build final where object
      const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            publicId: true,
            name: true,
            username: true,
            role: true,
            isActive: true,
            isSuper: true,
            createdAt: true,
            updatedAt: true,
            permissions: {
              select: {
                module: {
                  select: {
                    key: true,
                    name: true
                  }
                }
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      // Format permissions
      const formattedUsers = users.map(user => ({
        ...user,
        permissions: user.permissions.map(p => p.module.key)
      }));

      res.json({
        success: true,
        data: {
          users: formattedUsers,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  },

  // Get single user
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await prisma.user.findUnique({
        where: { publicId: id },
        select: {
          id: true,
          publicId: true,
          name: true,
          username: true,
          role: true,
          isActive: true,
          isSuper: true,
          createdAt: true,
          updatedAt: true,
          permissions: {
            select: {
              module: {
                select: {
                  id: true,
                  key: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Format permissions
      const formattedUser = {
        ...user,
        permissions: user.permissions.map(p => p.module.key)
      };

      res.json({
        success: true,
        data: formattedUser
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user'
      });
    }
  },

  // Create new user
  createUser: async (req, res) => {
    try {
      const { name, username, password, role, isActive, permissions } = req.body;

      // Check if username exists
      const existingUser = await prisma.user.findUnique({
        where: { username }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          username,
          password: hashedPassword,
          role: role.toUpperCase(),
          isActive: isActive !== undefined ? isActive : true
        },
        select: {
          id: true,
          publicId: true,
          name: true,
          username: true,
          role: true,
          isActive: true
        }
      });

      // Define default permissions that every user should have
      const defaultPermissionKeys = ['DASHBOARD', 'MY_TASK', 'PROFILE'];
      
      // Combine default permissions with any additional permissions provided
      const allPermissionKeys = permissions && permissions.length > 0 
        ? [...new Set([...defaultPermissionKeys, ...permissions])] // Remove duplicates
        : defaultPermissionKeys;

      // Assign permissions
      if (allPermissionKeys.length > 0) {
        const modules = await prisma.module.findMany({
          where: {
            key: { in: allPermissionKeys }
          }
        });

        const permissionData = modules.map(module => ({
          userId: user.id,
          moduleId: module.id
        }));

        await prisma.userPermission.createMany({
          data: permissionData
        });
      }

      res.status(201).json({
        success: true,
        message: 'User created successfully with default permissions',
        data: user
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }
  },

  // Update user
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, role, isActive, permissions } = req.body;

      // Find user by publicId
      const existingUser = await prisma.user.findUnique({
        where: { publicId: id }
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Protect super user from modifications
      if (existingUser.isSuper) {
        return res.status(403).json({
          success: false,
          message: 'Super Admin cannot be modified'
        });
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { publicId: id },
        data: {
          ...(name && { name }),
          ...(role && { role: role.toUpperCase() }),
          ...(isActive !== undefined && { isActive })
        },
        select: {
          id: true,
          publicId: true,
          name: true,
          username: true,
          role: true,
          isActive: true
        }
      });

      // Update permissions if provided
      if (permissions !== undefined) {
        // Delete existing permissions
        await prisma.userPermission.deleteMany({
          where: { userId: updatedUser.id }
        });

        // Add new permissions if any
        if (permissions.length > 0) {
          const modules = await prisma.module.findMany({
            where: {
              key: { in: permissions }
            }
          });

          const permissionData = modules.map(module => ({
            userId: updatedUser.id,
            moduleId: module.id
          }));

          await prisma.userPermission.createMany({
            data: permissionData
          });
        }
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
    }
  },

  // Delete user
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent deleting self
      if (req.user.publicId === id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      const user = await prisma.user.findUnique({
        where: { publicId: id }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Protect super user from deletion
      if (user.isSuper) {
        return res.status(403).json({
          success: false,
          message: 'Super Admin cannot be deleted'
        });
      }

      await prisma.user.delete({
        where: { publicId: id }
      });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }
  },

  // Update user status
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      // Prevent deactivating self
      if (req.user.publicId === id && !isActive) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account'
        });
      }

      const user = await prisma.user.findUnique({
        where: { publicId: id }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Protect super user from status changes
      if (user.isSuper) {
        return res.status(403).json({
          success: false,
          message: 'Super Admin status cannot be changed'
        });
      }

      await prisma.user.update({
        where: { publicId: id },
        data: { isActive }
      });

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status'
      });
    }
  },

  // Update password
  updatePassword: async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      const user = await prisma.user.findUnique({
        where: { publicId: id }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Protect super user password (only super user can change their own password)
      if (user.isSuper && req.user.publicId !== id) {
        return res.status(403).json({
          success: false,
          message: 'Super Admin password can only be changed by Super Admin'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.update({
        where: { publicId: id },
        data: { password: hashedPassword }
      });

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update password'
      });
    }
  },

  // Get all modules
  getModules: async (req, res) => {
    try {
      const modules = await prisma.module.findMany({
        orderBy: { name: 'asc' }
      });

      res.json({
        success: true,
        data: modules
      });
    } catch (error) {
      console.error('Error fetching modules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch modules'
      });
    }
  },

  // Get user permissions
  getUserPermissions: async (req, res) => {
    try {
      const { userId } = req.query;

      const permissions = await prisma.userPermission.findMany({
        where: { userId: parseInt(userId) },
        include: {
          module: true
        }
      });

      res.json({
        success: true,
        data: permissions.map(p => p.module.key)
      });
    } catch (error) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch permissions'
      });
    }
  },

  // Update user permissions
  updatePermissions: async (req, res) => {
    try {
      const { userId, permissions } = req.body;

      // Check if user is super admin
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Protect super user permissions
      if (user.isSuper) {
        return res.status(403).json({
          success: false,
          message: 'Super Admin permissions cannot be modified'
        });
      }

      // Delete existing permissions
      await prisma.userPermission.deleteMany({
        where: { userId: parseInt(userId) }
      });

      // Add new permissions
      if (permissions && permissions.length > 0) {
        const modules = await prisma.module.findMany({
          where: {
            key: { in: permissions }
          }
        });

        const permissionData = modules.map(module => ({
          userId: parseInt(userId),
          moduleId: module.id
        }));

        await prisma.userPermission.createMany({
          data: permissionData
        });
      }

      res.json({
        success: true,
        message: 'Permissions updated successfully'
      });
    } catch (error) {
      console.error('Error updating permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update permissions'
      });
    }
  }
};

module.exports = userController;