const bcrypt = require("bcryptjs");
const { prisma } = require("../../database/prisma");
const { generateToken } = require("../../utils/jwt");

const authService = {
  login: async ({ username, password }) => {
    if (!username || !password) {
      throw new Error("Username and password required");
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        permissions: {
          include: {
            module: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("Invalid username or password");
    }

    if (!user.isActive) {
      throw new Error("User is deactivated. Contact admin.");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error("Invalid username or password");
    }

    const token = generateToken({
      id: user.id,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.publicId,
        username: user.username,
        name: user.name,
        role: user.role,
        permissions: user.permissions.map(
          (p) => p.module.key
        ),
      },
    };
  },
};

module.exports = authService;
