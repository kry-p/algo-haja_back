/**
 * 사용자 API
 * @todo  Brute force 방어 적용
 */
import { clonePersonalRepository } from '../../lib/git';
import { fetchUserSolved } from '../../lib/external/boj';
import { fetchUserInfo } from '../../lib/external/solvedac';
import User from '../../models/user';

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
  // BOJ ID는 선택사항
  const { password, bojId } = ctx.request.body;

  if (!password) {
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
    if (bojId && bojId !== user.userData.bojId) {
      await user.setBojId(bojId);
      const solvedacUserData = await fetchUserInfo(bojId);

      // solved.ac에서 정보 받아오기
      if (solvedacUserData.error) {
        await user.setRequestSucceed('solvedac', false);
      } else {
        await user.setRequestSucceed('solvedac', true);
        await user.setSolvedacTier(solvedacUserData.data.tier);
      }

      // BOJ에서 정보 받아오기
      const solved = await fetchUserSolved(bojId);
      if (solved.error) {
        await user.setRequestSucceed('boj', false);
      } else {
        await user.setRequestSucceed('boj', true);
        await user.setUserSolved(solved);
      }
    }
    await User.updateOne({ username }, user);
    ctx.status = 204; // No content, accepted
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
  const { repoUrl, ruleConstant, bojDir } = ctx.request.body;

  if (!repoUrl || !ruleConstant) {
    ctx.status = 400;
    return;
  }

  try {
    const user = await User.findByUsername(username);
    if (!user) {
      ctx.status = 401;
      return;
    }
    try {
      await clonePersonalRepository(repoUrl, username);
    } catch (gitError) {
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
    const solved = await fetchUserSolved(user.userData.bojId);
    if (solved.error) {
      user.setRequestSucceed('boj', false);
      ctx.status = 401;
    } else {
      await user.setUserSolved(solved);
      await User.updateOne({ username }, user);
      ctx.status = 204;
    }
  } catch (err) {
    ctx.throw(500, err);
  }
};
