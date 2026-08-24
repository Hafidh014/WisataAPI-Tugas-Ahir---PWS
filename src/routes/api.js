const router = require('express').Router();

const c = require('../controllers/apiController');
const destinationController = require('../controllers/destinationController');

const { requireApiKey, requireJwt } = require('../middleware/auth');

// ===============================
// MANAGEMENT API - JWT
// ===============================

router.post(
  '/destinations',
  requireJwt,
  destinationController.create
);

router.put(
  '/destinations/:id',
  requireJwt,
  destinationController.update
);

router.delete(
  '/destinations/:id',
  requireJwt,
  destinationController.remove
);


// ===============================
// PUBLIC API - API KEY
// ===============================

router.use(requireApiKey);

router.get('/provinces', c.provinces);
router.get('/cities', c.cities);
router.get('/categories', c.categories);

router.get('/destinations', c.destinations);
router.get('/destinations/:id', c.destination);

module.exports = router;