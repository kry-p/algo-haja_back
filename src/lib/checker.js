import Group from '../models/group';
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

export const checkGroupExists = async (ctx, next) => {
  const { groupName } = ctx.request.body;
  const group = await Group.findOne({ groupName });

  if (!group) {
    ctx.status = 401;
    return;
  }
  return next();
};

export const checkPracticeExists = async (ctx, next) => {
  const { practiceName } = ctx.request.body;
  const practice = await Group.findOne({
    'practice.practiceName': practiceName,
  });

  if (!practice) {
    ctx.status = 401;
    return;
  }
  return next();
};
