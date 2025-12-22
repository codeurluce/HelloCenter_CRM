// middlewares/siteScope.js
module.exports = (req, res, next) => {
  if (!req.user || !req.user.site_id) {
    return res.status(403).json({
      error: "Accès refusé : site non défini"
    });
  }

  // Convention globale unique
  req.siteId = req.user.site_id;

  next();
};