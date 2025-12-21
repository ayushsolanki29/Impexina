const jwt = require("jsonwebtoken");

const getMidnightExpiry = () => {
  const now = new Date();
  const midnight = new Date();

  midnight.setHours(24, 0, 0, 0); // Today midnight (12 AM)

  const seconds = Math.floor((midnight - now) / 1000);
  return seconds > 0 ? seconds : 60; // fallback
};

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: getMidnightExpiry(),
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
