import User from '../models/user';

export const checkLoggedIn = (ctx, next) => {
  if (!ctx.state.user) {
    ctx.status = 401;
    return;
  }
  return next();
};

export const checkAdmin = async (ctx, next) => {
  const user = await User.findOne(ctx.state.user);

  if (!user.isAdmin) {
    ctx.status = 401;
    return;
  }

  return next();
};
