/*
 * 검증용
 */
import Group from '../models/group';
import User from '../models/user';

// 로그인 여부
export const checkLoggedIn = (ctx, next) => {
  if (!ctx.state.user) {
    ctx.status = 401;
    return;
  }
  return next();
};

// 관리자 여부
export const checkAdmin = async (ctx, next) => {
  const user = await User.findOne(ctx.state.user);

  if (!user.isAdmin) {
    ctx.status = 401;
    return;
  }

  return next();
};

// 접근하는 그룹 존재 여부
export const checkGroupExists = async (ctx, next) => {
  const { groupName } = ctx.request.body;
  const group = await Group.findOne({ groupName });

  if (!group) {
    ctx.status = 401;
    return;
  }
  return next();
};

// 접근하는 연습 존재 여부
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
