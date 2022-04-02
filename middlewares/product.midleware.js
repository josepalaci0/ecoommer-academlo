// Models
const { Product } = require('../models/product.model');

// Utils
const { AppError } = require('../util/appError');
const { catchAsync } = require('../util/catchAsync');

exports.productExists = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findOne({
    where: { id: id, status: 'active' }
  });

  if (!product) {
    return next(new AppError(404, 'Product not found with given id'));
  }

  req.product = product;
  next();
});

exports.protectAccountOwner = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { currentUser } = req;

  if (currentUser.id !== +id) {
    return next(new AppError(403, `You can't update other users accounts`));
  }

  next();
});
