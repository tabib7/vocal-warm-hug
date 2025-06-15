import jwt from 'jsonwebtoken';

// JWT Secret Key (should be in .env, but using hardcoded for now as per auth.routes.js)
const JWT_SECRET = 'ems_jwt_secret';

const auth = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // decoded contains { id: user._id, role: user.role }
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

export default auth;
