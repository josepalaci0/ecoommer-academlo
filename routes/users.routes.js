const express = require('express');

// Controllers
const {
  loginUser,
  createUser,
  getAllUsers,
  getUserById,
  updatePatchUser,
  updateUser,
  deleteUser,
  getUsersProducts,
  getAllOrdeUser,
  getOneOrdeUser
} = require('../controllers/users.controller');

// Middlewares
const { validateSession } = require('../middlewares/auth.middleware');
const {
  userExists,
  protectAccountOwner
} = require('../middlewares/users.middleware');

const router = express.Router();

router.post('/', createUser);

router.post('/login', loginUser);

router.use(validateSession);

router.get('/', getAllUsers);

router.get('/me', getUsersProducts);

router.get('/orders', getAllOrdeUser);

router.get('/orders/:id', getOneOrdeUser);

router
  .route('/:id', userExists)
  .get(getUserById)
  .patch(protectAccountOwner, updatePatchUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = { usersRouter: router };
