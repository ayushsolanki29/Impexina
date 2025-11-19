const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../database/prisma');
const { validateLogin, validateRegister } = require('./auth.validation');

const authService = {
  login: async (email, password) => {
    const { error } = validateLogin({ email, password });
    if (error) throw new Error(error.details[0].message);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid email or password');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) throw new Error('Invalid email or password');

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  },

  register: async (userData) => {
    const { error } = validateRegister(userData);
    if (error) throw new Error(error.details[0].message);

    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });
    if (existingUser) throw new Error('User already exists');

    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  },

  getProfile: async (userId) => {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
  }
};

module.exports = authService;