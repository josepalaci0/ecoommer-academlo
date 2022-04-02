const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Models
const { User } = require('../models/user.model');
const { Product } = require('../models/product.model');
const { Order } = require('../models/orders.model');

// Utils
const { catchAsync } = require('../util/catchAsync');
const { AppError } = require('../util/appError');

dotenv.config({ path: './config.env' });

//create users
exports.createUser = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body;

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    username,
    email,
    password: hashedPassword
  });

  if (newUser) {
    console.log('user creting');
    newUser.password = undefined;

    res.status(201).json({
      status: 'success',
      data: { newUser }
    });
  } else {
    return next(new AppError(404, 'failed operation create user'));
  }
});

//login
exports.loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user given an email and has status active
  const user = await User.findOne({
    where: { email, status: 'active' }
  });

  // Compare entered password vs hashed password
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError(400, 'Credentials are invalid'));
  }

  // Create JWT
  const token = await jwt.sign(
    { id: user.id }, // Token payload
    process.env.JWT_SECRET, // Secret key
    {
      expiresIn: process.env.JWT_EXPRES_IN
    }
  );

  res.status(200).json({
    status: 'success',
    data: { token }
  });
});

//get all users
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.findAll({
    attributes: { exclude: ['password'] },
    where: { status: 'active' }
  });
  if (users) {
    res.status(200).json({ status: 'success', data: { users } });
  } else {
    return next(new AppError(404, 'failed operation get users'));
  }
});

//get user by id
exports.getUserById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findOne({ where: { id: id, status: 'active' } });
  if (user) {
    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } else {
    return next(new AppError(404, 'failed operation get of id users'));
  }
});

//update patch
exports.updatePatchUser = catchAsync(async (req, res, next) => {
  const { user } = req;

  const data = filterObj(req.body, 'username', 'email');

  await user.update({ ...data });

  res.status(204).json({ status: 'success' });
});

//update user
exports.updateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { username, email, password } = req.body;

  if (username !== null || email !== null || password !== null) {
    const user = await User.findOne({ where: { id: id, status: 'active' } });

    if (user) {
      await user.update({
        username: username,
        email: email,
        password: password
      });
      res.status(204).json({ status: 'success' });
    } else {
      return next(new AppError(404, 'failed operation update user'));
    }
  }
});

//delete user
exports.deleteUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findOne({ where: { id: id, status: 'active' } });

  if (user) {
    await user.update({ status: 'deleted' });
    res.status(204).json({ status: 'success' });
  } else {
    return next(new AppError(404, 'failed operation delete user'));
  }
});

//get users products
exports.getUsersProducts = catchAsync(async (req, res, next) => {
  const { id } = req.currentUser;

  const products = await Product.findAll({
    where: { userId: id },
    attributes: { exclude: ['updatedAt', 'createdAt'] }
  });

  res.status(200).json({
    status: 'success',
    data: { products }
  });
});

//get all ordes the user
exports.getAllOrdeUser = catchAsync(async (req, res, next) => {
  const { id } = req.currentUser;

  const orders = await Order.findAll({
    where: { userId: id },
    attributes: { exclude: ['updatedAt', 'createdAt'] }
  });

  res.status(200).json({
    status: 'success',
    data: { orders }
  });
});

//get all one the user
exports.getOneOrdeUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const orders = await Order.findOne({
    where: { id: id, userId: req.currentUser.id },
    attributes: { exclude: ['updatedAt', 'createdAt'] }
  });

  res.status(200).json({
    status: 'success',
    data: { orders }
  });
});
