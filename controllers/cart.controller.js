// Models
const { Cart } = require('../models/carts.model');
const { Product } = require('../models/product.model');
const { ProductsInCart } = require('../models/productsInCart.model');
const { Order } = require('../models/orders.model');

// Utils
const { catchAsync } = require('../util/catchAsync');
const { AppError } = require('../util/appError');

//get all user cart
exports.getUserCart = catchAsync(async (req, res, next) => {
  const { id } = req.currentUser;

  const cart = await Cart.findOne({
    where: { status: 'active', userId: id },
    include: [
      {
        model: Product,
        through: { where: { status: 'active', userId: id } }
      }
    ]
  });

  if (!cart) {
    return next(new AppError(404, 'This user does not have a cart yet'));
  }

  res.status(200).json({ status: 'success', data: { cart } });
});

//add Products a cart
exports.addProductToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity } = req.body;
  const { id } = req.currentUser;

  const products = await Product.findAll({
    attributes: { exclude: ['updatedAt', 'createdAt'] },
    where: { status: 'active', userId: id }
  });

  // funtion ValidateProductId check if the user created the product
  const ValidateProductId = async (idProduct, productId, id) => {
    console.log(idProduct, productId, id);

    //if idProduct === productId example : idProduct =3 productId=2 = Error ,
    // otherwise it will be assed

    if (idProduct === productId) {
      // Check if product to add, does not exceeds that requested amount
      const product = await Product.findOne({
        where: { status: 'active', userId: id }
      });

      if (quantity > product.quantity) {
        return next(
          new AppError(400, `This product only has ${product.quantity} items.`)
        );
      }

      // Check if user's cart is active, if not, create one
      const cart = await Cart.findOne({
        where: { status: 'active', userId: id }
      });

      if (!cart) {
        // Create a new cart
        const newCart = await Cart.create({ userId: id });

        await ProductsInCart.create({
          productId,
          cartId: newCart.id,
          quantity
        });
      } else {
        // Cart already exists
        // Check if product is already in the cart
        const productExists = await ProductsInCart.findOne({
          where: { cartId: cart.id, productId }
        });

        if (productExists && productExists.status === 'active') {
          return next(new AppError(400, 'This product is already in the cart'));
        }

        // If product is in the cart but was removed before, add it again
        if (productExists && productExists.status === 'removed') {
          await productExists.update({ status: 'active', quantity });
        }

        // Add new product to cart
        if (!productExists) {
          await ProductsInCart.create({ cartId: cart.id, productId, quantity });
        }
      }
      res.status(201).json({ status: 'success' });
    } else {
      return next(new AppError(403, ' checke if i create the produc'));
    }
  };

  products.map(async (res) => {
    console.log(res.id);
    if (res.id === productId) {
      console.log(res.id, productId);
      return ValidateProductId(res.id, productId, id);
    }
  });
});

//update Prducts on de cart
exports.updateCartProduct = catchAsync(async (req, res, next) => {
  const { id } = req.currentUser;
  const { productId, quantity } = req.body;

  // Check if quantity exceeds available amount
  const product = await Product.findOne({
    where: { status: 'active', id: productId, userId: id }
  });

  if (quantity > product.quantity) {
    return next(
      new AppError(400, `This product only has ${product.quantity} items`)
    );
  }

  // Find user's cart
  const cart = await Cart.findOne({
    where: { status: 'active', userId: id }
  });

  if (!cart) {
    return next(new AppError(400, 'This user does not have a cart yet'));
  }

  // Find the product in cart requested
  const productsInCart = await ProductsInCart.findOne({
    where: { status: 'active', cartId: cart.id, productId }
  });

  if (!productsInCart) {
    return next(
      new AppError(404, `Can't update product, is not in the cart yet`)
    );
  }

  // If qty is 0, mark the product's status as removed
  if (quantity === 0) {
    await productsInCart.update({ quantity: 0, status: 'removed' });
  }

  // Update product to new qty
  if (quantity > 0) {
    await productsInCart.update({ quantity });
  }

  res.status(204).json({ status: 'success' });
});

//Remove product on the cart
exports.removeProductFromCart = catchAsync(async (req, res, next) => {
  const { id } = req.currentUser;
  const { productId } = req.params;

  const cart = await Cart.findOne({
    where: { status: 'active', userId: id }
  });

  if (!cart) {
    return next(new AppError(404, 'This user does not have a cart yet'));
  }

  const productsInCart = await ProductsInCart.findOne({
    where: { status: 'active', cartId: cart.id, productId }
  });

  if (!productsInCart) {
    return next(new AppError(404, 'This product does not exist in this cart'));
  }

  await productsInCart.update({ status: 'deleted', quantity: 0 });

  res.status(204).json({ status: 'success' });
});

//purchaseCart
exports.purchaseCart = catchAsync(async (req, res, next) => {
  const { id } = req.currentUser;

  // Find user's cart
  const cart = await Cart.findOne({
    where: { status: 'active', userId: id },
    include: [
      {
        model: Product,
        through: {
          where: { status: 'active' }
        }
      }
    ]
  });

  if (!cart) {
    return next(new AppError(404, 'This user does not have a cart yet'));
  }

  let totalPrice = 0;

  // Update all products as purchased
  const cartPromises = cart.products.map(async (product) => {
    console.log(product.productsincart);
    await product.productsincart.update({ status: 'purchased' });

    // Get total price of the order
    const productPrice = product.price * product.productsincart.quantity;

    totalPrice += productPrice;

    // Discount the quantity from the product
    const newQty = product.quantity - product.productsincart.quantity;

    return await product.update({ quantity: newQty });
  });

  await Promise.all(cartPromises);

  // Mark cart as purchased
  await cart.update({ status: 'purchased' });

  const newOrder = await Order.create({
    userId: id,
    cartId: cart.id,
    issuedAt: Date.now().toLocaleString(),
    totalPrice: totalPrice
  });

  res.status(201).json({
    status: 'success',
    data: { newOrder }
  });
});
