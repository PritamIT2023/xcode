// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.isAuthenticated) {
      next();
  } else {
      res.redirect('/login');
  }
};

module.exports = isAuthenticated;
