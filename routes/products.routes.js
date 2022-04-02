const express = require('express');

// Controllers
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require('../controllers/products.controller');

// Middlewares
const { validateSession } = require('../middlewares/auth.middleware');
const { productExists } = require('../middlewares/product.midleware');

const router = express.Router();

router.use(validateSession);

router.route('/').post(createProduct).get(getAllProducts);

router
  .route('/:id', productExists)
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = { productsRouter: router };
