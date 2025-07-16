const authorizeRole = (roles = []) => {
  return (req, res, next) => {
    try {
      const userRole = req.user.role;
      if (!userRole || !roles.includes(userRole)) {
        throw new Error("You are not authorized for this action.");
      }
      next();
    } catch (error) {
      res.status(403).send("FAILED! " + error.message); // 403 is more appropriate here than 400
    }
  };
};

module.exports = authorizeRole;
