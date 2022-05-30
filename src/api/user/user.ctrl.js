import { clonePersonalRepository } from '../../lib/git';
import { fetchUserSolved } from '../../lib/scrap';
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
 * 사용자 기본 정보 업데이트
 * PATCH - /api/user/basic
 */
export const updateBasicInfo = async (ctx) => {
  const userdata = ctx.state.user;
  // BOJ ID는 선택사항
  const { password, bojId } = ctx.request.body;

  if (!password) {
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
    if (bojId && bojId !== user.userData.bojId) await user.setBojId(bojId);
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
export const updateGitRepositoryInfo = async (ctx) => {
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
    await User.updateOne(
      { username: userdata.username },
      {
        $set: {
          gitRepoInformation: {
            linked: true,
            repoURL: repoUrl,
            linkRule: ruleConstant,
          },
        },
      },
    );
    ctx.status = 204;
  } catch (err) {
    ctx.throw(500, err);
  }
};

/*
 * 사용자가 푼 문제 정보 업데이트
 * PATCH - /api/user/solved
 */
export const updateSolvedProblem = async (ctx) => {
  const { username } = ctx.request.body;

  if (!username) {
    ctx.status = 400;
    return;
  }

  try {
    const user = await User.findByUsername(username);
    if (!user) {
      ctx.status = 401;
      return;
    }

    if (user.userData.bojId === '') {
      ctx.status = 401;
      return;
    }

    const solved = await fetchUserSolved(user.userData.bojId);
    if (solved.error) {
      ctx.status = 401;
      return;
    }

    await User.findOneAndUpdate(
      { username: username },
      {
        $set: {
          'userData.solvedProblem': solved.data.solved,
          'userData.triedProblem': solved.data.wrong,
        },
      },
    );
    ctx.status = 204;
  } catch (err) {
    ctx.throw(500, err);
  }
};
