const dotenv = require('dotenv');

// Models
const { Product } = require('../models/product.model');

// Utils
const { catchAsync } = require('../util/catchAsync');
const { AppError } = require('../util/appError');

dotenv.config({ path: './config.env' });

//create products
exports.createProduct = catchAsync(async (req, res, next) => {
  const { title, description, quantity, price } = req.body;

  const { id } = req.currentUser;

  const newProduct = await Product.create({
    title,
    description,
    quantity,
    price,
    userId: id
  });

  if (newProduct) {
    const products = await Product.findAll({
      attributes: { exclude: ['updatedAt', 'createdAt'] },
      where: { status: 'active', userId: id }
    });
    res.status(201).json({
      status: 'success',
      data: { products }
    });
  } else {
    return next(new AppError(404, 'failed operation create product'));
  }
});

// get all products
exports.getAllProducts = catchAsync(async (req, res, next) => {
  const { id } = req.currentUser;
  const products = await Product.findAll({
    attributes: { exclude: ['updatedAt', 'createdAt'] },
    where: { status: 'active', userId: id }
  });

  if (products) {
    res.status(200).json({ status: 'success', data: { products } });
  } else {
    return next(new AppError(404, 'failed operation list products'));
  }
});

//get by id product
exports.getProductById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findOne({
    where: { id: id, status: 'active', userId: req.currentUser.id },
    attributes: { exclude: ['updatedAt', 'createdAt'] }
  });

  if (product) {
    res.status(200).json({
      status: 'success',
      data: { product }
    });
  } else {
    return next(
      new AppError(
        404,
        'failed operation list you do not have permission to obtain data'
      )
    );
  }
});

//update product
exports.updateProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, description, quantity, price } = req.body;

  if (
    title !== null ||
    description !== null ||
    quantity !== null ||
    price !== null
  ) {
    const product = await Product.findOne({
      where: { id: id, status: 'active', userId: req.currentUser.id }
    });
    if (product) {
      await product.update({
        title,
        description,
        quantity,
        price
      });

      res.status(204).json({ status: 'success' });
    }
  } else {
    return next(
      new AppError(
        404,
        'failed operation update products you do not have permission to obtain data'
      )
    );
  }
});

//delete product
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findOne({
    where: { id: id, status: 'active', userId: req.currentUser.id }
  });
  if (product !== null) {
    await product.update({ status: 'deleted' });

    res.status(204).json({ status: 'success' });
  } else {
    return next(
      new AppError(
        404,
        'failed operation delete products you do not have permission to obtain data'
      )
    );
  }
});
