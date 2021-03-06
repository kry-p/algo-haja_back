/**
 * 사용자 API
 * @todo  Brute force 방어 적용
 */
import User from '../../models/user';
import { clonePersonalRepository } from '../../lib/git';
import { addToBojQueue } from '../../lib/schedule';
import { bojIdRegex, passwordRegex, GIT_RULE_1 } from '../../lib/constants';
// URI validator
import { isUri } from 'valid-url';
// Path validator
import isValid from 'is-valid-path';

/**
 * POST - /api/user/info
 *
 * @param   ctx.state.user
 * @returns 성공 시 ctx.body로 사용자 정보
 * @brief   사용자 정보를 제공합니다.
 */
export const getUserInfo = async (ctx) => {
  const { username } = ctx.state.user;
  try {
    const data = await User.findByUsername(username);
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

/**
 * POST - /api/user/password
 *
 * @param   ctx.request.body - password, newPassword, newPasswordConfirm
 * @returns 성공 시 HTTP 204 Response
 * @brief   사용자 비밀번호를 변경합니다.
 */
export const changeUserPassword = async (ctx) => {
  const { username } = ctx.state.user;
  const { password, newPassword, newPasswordConfirm } = ctx.request.body;

  if (!password || !newPassword || !newPasswordConfirm) {
    ctx.status = 400;
    return;
  }

  if (newPassword !== newPasswordConfirm) {
    ctx.status = 401;
    return;
  }
  if (!passwordRegex.test(newPassword)) {
    ctx.status = 400;
    return;
  }

  try {
    const user = await User.findByUsername(username);
    if (!user) {
      ctx.status = 401;
      return;
    }
    const valid = await user.checkPassword(password);
    if (!valid) {
      ctx.status = 401;
      return;
    }
    if (user.isTestAccount) {
      ctx.status = 403;
      return;
    }
    await user.setPassword(newPassword);
    await User.updateOne({ username }, user);
    ctx.status = 204;
  } catch (err) {
    ctx.throw(500, err);
  }
};

/**
 * PATCH - /api/user/basic
 *
 * @param   ctx.request.body - password, ( bojId )
 * @returns 성공 시 HTTP 204 Response
 * @brief   사용자 기본 정보를 업데이트합니다.
 */
export const updateBasicInfo = async (ctx) => {
  const { username } = ctx.state.user;
  const { password, bojId } = ctx.request.body;

  if (!password || !bojId) {
    ctx.status = 400;
    return;
  }
  if (!bojIdRegex.test(bojId)) {
    ctx.status = 400;
    return;
  }
  try {
    const user = await User.findByUsername(username);
    if (!user) {
      ctx.status = 404;
      return;
    }
    const valid = await user.checkPassword(password);
    if (!valid) {
      ctx.status = 401;
      return;
    }
    if (user.isTestAccount) {
      ctx.status = 403;
      return;
    }
    if (bojId !== user.userData.bojId) {
      await user.setBojId(bojId);
      addToBojQueue(bojId);
    }
    await User.updateOne({ username }, user);
    ctx.status = 202; // accepted
  } catch (err) {
    ctx.throw(500, err);
  }
};

/**
 * PATCH - /api/user/git
 *
 * @param   ctx.request.body - repoUrl, ruleConstant
 * @returns 성공 시 HTTP 204 Response
 * @brief   Git 저장소 정보를 업데이트하고 해당 저장소를 복제합니다.
 */
export const updateGitRepositoryInfo = async (ctx) => {
  const { username } = ctx.state.user;
  const { password, repoUrl, ruleConstant, bojDir } = ctx.request.body;
  if (!repoUrl || !password) {
    ctx.status = 400;
    return;
  }
  if (!(isUri(repoUrl) && isValid(bojDir))) {
    ctx.status = 400;
    return;
  }
  try {
    const user = await User.findByUsername(username);
    if (!user) {
      ctx.status = 401;
      return;
    }
    const valid = await user.checkPassword(password);
    if (!valid) {
      ctx.status = 401;
      return;
    }
    if (user.isTestAccount) {
      ctx.status = 403;
      return;
    }
    try {
      await clonePersonalRepository(repoUrl, username);
    } catch (err) {
      ctx.status = 400;
      return;
    }
    await User.updateOne(
      { username },
      {
        $set: {
          gitRepoInformation: {
            linked: true,
            repoUrl: repoUrl,
            bojDir: bojDir ? bojDir : './',
            linkRule: ruleConstant ? ruleConstant : GIT_RULE_1,
          },
        },
      },
    );
    ctx.status = 204;
  } catch (err) {
    ctx.throw(500, err);
  }
};

/**
 * PATCH - /api/user/solved
 *
 * @param   ctx.state.user (required)
 * @returns 성공 시 HTTP 204 Response
 * @brief   BOJ ID가 있는 경우 해당 사용자 정보에서 푼 문제 정보를 가져옵니다.
 */
export const updateSolvedProblem = async (ctx) => {
  const { username } = ctx.state.user;
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
    await user.setBojId(user.userData.bojId);
    addToBojQueue(user.bojId);
    await User.updateOne({ username }, user);
    ctx.status = 202;
  } catch (err) {
    ctx.throw(500, err);
  }
};
