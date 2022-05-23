import { clonePersonalRepository } from '../../lib/git';
import User from '../../models/user';

/*
 * 사용자 정보 조회
 * POST - /api/user/info
 */
export const getUserInfo = async (ctx) => {
  const user = ctx.state.user;
  try {
    const data = await User.findByUsername(user.username);
    if (!data) {
      ctx.status = 401;
      return;
    }
    ctx.body = data.serializePrivateData();
    ctx.status = 200;
  } catch (err) {
    ctx.throw(500, err);
  }
};

/*
 * 비밀번호 변경
 * POST - /api/user/password
 */
export const changeUserPassword = async (ctx) => {
  const userdata = ctx.state.user;
  const { password, newPassword, newPasswordConfirm } = ctx.request.body;

  if (!password || !newPassword || !newPasswordConfirm) {
    ctx.status = 400;
    return;
  }

  if (newPassword !== newPasswordConfirm) {
    ctx.status = 401;
    return;
  }

  try {
    const user = await User.findByUsername(userdata.username);
    if (!user) {
      ctx.status = 401;
      return;
    }
    const valid = await user.checkPassword(password);
    if (!valid) {
      ctx.status = 401;
      return;
    }
    await user.setPassword(newPassword);
    await User.updateOne({ username: userdata.username }, user);
    ctx.status = 204;
  } catch (err) {
    ctx.throw(500, err);
  }
};

/*
 * 닉네임 중복 확인
 * POST - /api/user/nickname
 */
export const checkNickname = async (ctx) => {
  const { nickname } = ctx.request.body;

  if (!nickname) {
    ctx.status = 400;
    return;
  }

  try {
    const user = await User.findByNickname(nickname);
    if (user) {
      ctx.status = 401;
      return;
    }
    ctx.status = 204; // No content, accepted
  } catch (err) {
    ctx.throw(500, err);
  }
};

/*
 * 사용자 기본 정보 업데이트
 * PATCH - /api/user/basic
 */
export const updateBasicInfo = async (ctx) => {
  const userdata = ctx.state.user;
  const { password, nickname } = ctx.request.body;

  if (!password || !nickname) {
    ctx.status = 400;
    return;
  }

  try {
    const user = await User.findByUsername(userdata.username);
    if (!user) {
      ctx.status = 401;
      return;
    }
    const valid = await user.checkPassword(password);
    if (!valid) {
      ctx.status = 401;
      return;
    }

    await user.setNickname(nickname);
    await User.updateOne({ username: userdata.username }, user);
    ctx.status = 204; // No content, accepted
  } catch (err) {
    ctx.throw(500, err);
  }
};

/*
 * Git 저장소 정보 업데이트
 * PATCH - /api/user/git
 */
export const updateGitRepositoryinfo = async (ctx) => {
  const userdata = ctx.state.user;
  const { repoUrl, ruleConstant } = ctx.request.body;

  if (!repoUrl || !ruleConstant) {
    ctx.status = 400;
    return;
  }

  try {
    const user = await User.findByUsername(userdata.username);
    if (!user) {
      ctx.status = 401;
      return;
    }
    try {
      await clonePersonalRepository(repoUrl, userdata.username);
    } catch (gitError) {
      ctx.status = 400;
      return;
    }
    await User.updateOne({
      $set: {
        gitRepoInformation: {
          linked: true,
          repoURL: repoUrl,
          linkRule: ruleConstant,
        },
      },
    });
    ctx.status = 204;
  } catch (err) {
    ctx.throw(500, err);
  }
};
