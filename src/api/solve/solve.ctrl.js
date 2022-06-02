/**
 * 문제풀이 정보 API
 */
import { findGroupSource, findPersonalSource } from '../../lib/git';
import Solve from '../../models/solve';
import Group from '../../models/group';
import User from '../../models/user';

/**
 * PUT - /api/solve
 *
 * @param  ctx.state.user - user
 * @param  ctx.request.body - problemId, source
 * @return 성공 시 HTTP 201 Response
 * @brief  중복되지 않은 소스코드에 한해 문제풀이를 등록합니다.
 */
export const addSolve = async (ctx) => {
  const { username } = ctx.state.user;
  const { problemId, source } = ctx.request.body;

  if (!problemId || !source) {
    ctx.status = 400;
    return;
  }

  try {
    // 중복 여부 확인
    const check = await Solve.findOne({
      $and: [{ username }, { problemId }, { source }],
    });
    if (check) {
      ctx.status = 409;
      return;
    }
    const solve = new Solve({
      username,
      problemId,
      source,
    });
    solve.save();
    ctx.status = 201;
  } catch (err) {
    ctx.throw(500, err);
  }
};

/**
 * POST - /api/solve
 *
 * @param   ctx.request.body - username, problemId
 * @return  성공 시 문제 풀이 목록
 * @brief   사용자의 문제 풀이 목록을 가져옵니다.
 */
export const getSolveFromDatabase = async (ctx) => {
  const user = ctx.state.user;
  const { username, problemId } = ctx.request.body;

  // 입력이 올바른지 체크
  if (!problemId || !username) {
    ctx.status = 400;
    return;
  }

  try {
    // 요청하는 사용자가 있는지 체크
    const currentUser = await User.findOne({ username: user.username });
    if (!currentUser) {
      ctx.status = 401;
      return;
    }
    // 요청하는 문제풀이 정보
    const solve = await Solve.find({ $and: [{ username }, { problemId }] });
    const solvedUser = await User.findOne({ username });
    ctx.status = 200;

    if (currentUser.username === solvedUser.username) {
      ctx.body = solve;
    } else {
      ctx.body = solve.filter((solve) => {
        solvedUser.userData.sourceOpened &&
          currentUser.userData.solvedProblem.includes(solve.problemId);
      });
    }
  } catch (err) {
    ctx.throw(500, err);
  }
};

/**
 * POST - /api/solve/git/personal
 *
 * @param   ctx.state.user - username
 * @param   ctx.request.body - problemId
 * @return  성공 시 문제 풀이 목록 Response
 * @brief   개인 저장소에서 지정한 문제번호의 문제 풀이 목록을 가져옵니다.
 */
export const getSolveFromPersonalGit = async (ctx) => {
  const { username } = ctx.state.user;
  const { problemId } = ctx.request.body;

  if (!problemId) {
    ctx.status = 400;
    return;
  }

  try {
    const user = await User.findOne({ username });
    // 찾는 사용자가 없음
    if (!user) {
      ctx.status = 401;
      return;
    }
    // Git 저장소가 등록되어 있지 않음
    if (!user.gitRepoInformation.linked) {
      ctx.status = 204;
      return;
    }
    // BOJ 소스코드 디렉터리가 지정되어 있으면 해당 디렉터리에서 가져옴
    const bojDir = user.gitRepoInformation.bojDir;
    const result = bojDir
      ? findPersonalSource(username, problemId, bojDir)
      : findPersonalSource(username, problemId);
    if (result.error) {
      ctx.status = 401;
      return;
    }
    ctx.body = result;
    ctx.status = 200;
  } catch (err) {
    ctx.throw(500, err);
  }
};

/**
 * POST - /api/solve/git/group
 *
 * @param   ctx.state.user - username
 * @param   ctx.request.body - groupName, problemId
 * @return  성공 시 문제 풀이 목록 Response
 * @brief   그룹 저장소에서 사용자별 지정한 문제번호의 문제 풀이 목록을 가져옵니다.
 */
export const getSolveFromGroupGit = async (ctx) => {
  const { username } = ctx.state.user;
  const { groupName, problemId } = ctx.request.body;

  if (!groupName || !problemId) {
    ctx.status = 400;
    return;
  }

  try {
    const group = await Group.findOne({ groupName });
    // 찾는 그룹이 없음
    if (!group) {
      ctx.status = 404;
      return;
    }
    // 그룹에 해당 멤버가 없음
    if (!group.member.includes(username)) {
      ctx.status = 401;
      return;
    }
    // Git 연동이 되어있지 않음
    if (!group.gitRepoInformation.linked) {
      ctx.status = 204;
      return;
    }
    const user = await User.findOne({ username });
    if (!user) {
      ctx.status = 401;
      return;
    }

    if (!user.userData.solvedProblem.includes(problemId)) {
      ctx.status = 200;
      ctx.body = [];
      return;
    }

    // BOJ 소스코드 디렉터리가 지정되어 있으면 해당 디렉터리에서 가져옴
    const bojDir = group.gitRepoInformation.bojDir;
    const solve = bojDir
      ? findGroupSource(groupName, problemId, bojDir)
      : findGroupSource(groupName, problemId);
    if (solve.error) {
      ctx.status = 401;
      return;
    }

    ctx.status = 200;
    ctx.body = solve;
  } catch (err) {
    ctx.throw(500, err);
  }
};

/**
 * PATCH - /api/solve
 *
 * @param   ctx.state.user - username
 * @param   ctx.request.body - _id, source
 * @return  성공 시 HTTP 204 Response
 * @brief   선택한 문제의 풀이 정보를 업데이트합니다.
 */
export const updateSolve = async (ctx) => {
  const { username } = ctx.state.user;
  const { _id, source } = ctx.request.body;

  if (!_id || !source) {
    ctx.status = 400;
    return;
  }

  try {
    const user = await User.findOne({ username });
    if (!user || user.username !== username) {
      ctx.state = 401;
      return;
    }
    const solve = await Solve.findOneAndUpdate({ _id }, { $set: { source } });
    if (!solve) {
      ctx.state = 401;
      return;
    }
    ctx.status = 204;
  } catch (err) {
    ctx.throw(500, err);
  }
};

/**
 * DELETE - /api/solve
 *
 * @param   ctx.state.user - username
 * @param   ctx.request.body - _id
 * @return  성공 시 HTTP 204 Response
 * @brief   선택한 문제의 풀이 정보를 삭제합니다.
 */
export const deleteSolve = async (ctx) => {
  const { username } = ctx.state.user;
  const { _id } = ctx.request.body;

  if (!_id) {
    ctx.status = 400;
    return;
  }

  try {
    // 자기 자신의 풀이만 삭제할 수 있음
    const solve = await Solve.findOne({
      $and: [{ _id }, { username }],
    });
    if (!solve) {
      ctx.status = 409; // Conflict (없는 것을 삭제하려고 시도)
      return;
    }
    await Solve.deleteOne({
      $and: [{ _id }, { username }],
    });
    ctx.status = 204;
  } catch (err) {
    ctx.throw(500, err);
  }
};
