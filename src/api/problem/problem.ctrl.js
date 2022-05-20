import Problem from '../../models/problem';
import User from '../../models/user';
import Group from '../../models/group';

/*
 * 문제 추가
 * PUT - /api/problem
 */
export const addProblem = async (ctx) => {
  const { problemId, problemName, solvedacTier, tags } = ctx.request.body;
  // 필수 항목 체크
  if (!problemId || !problemName) {
    ctx.status = 401;
    return;
  }

  try {
    // 중복 체크
    const check = await Problem.findOne({ problemId });
    if (check) {
      ctx.status = 409;
      return;
    }

    const problem = new Problem({
      problemId,
      problemName,
      solvedacTier,
      tags,
    });
    problem.save();

    ctx.status = 201; // created
  } catch (err) {
    ctx.throw(500, err);
  }
};

/*
 * 문제 정보 수정
 * UPDATE - /api/problem
 */
export const updateProblem = async (ctx) => {
  const { problemId, ...rest } = ctx.request.body;
  if (!problemId) {
    ctx.status = 404;
    return;
  }
  try {
    const update = rest;
    const problem = await Problem.findOneAndUpdate({ problemId }, update);
    if (!problem) {
      ctx.status = 404;
      return;
    }

    ctx.status = 204; // No content
  } catch (err) {
    ctx.throw(500, err);
  }
};

/*
 * 사용자가 푼 문제 조회
 * POST - /api/problem/user-solved
 */
export const getUserSolved = async (ctx) => {
  const { username } = ctx.request.body;

  if (!username) {
    ctx.status = 401;
    return;
  }

  try {
    const user = await User.findByUsername(username);
    if (!user) {
      ctx.status = 401;
      return;
    }
    const problem = await Problem.find()
      .in('problemId', user.userData.solvedProblem)
      .exec();

    ctx.body = problem;
  } catch (err) {
    ctx.throw(500, err);
  }
};

/*
 * 사용자가 풀지 못한 문제 조회
 * POST - /api/problem/user-tried
 */
export const getUserTried = async (ctx) => {
  const { username } = ctx.request.body;

  if (!username) {
    ctx.status = 401;
    return;
  }

  try {
    const user = await User.findByUsername(username);
    if (!user) {
      ctx.status = 401;
      return;
    }
    const problem = await Problem.find()
      .in('problemId', user.userData.triedProblem)
      .exec();

    ctx.body = problem;
  } catch (err) {
    ctx.throw(500, err);
  }
};

/*
 * 진행 중인 그룹 연습 문제 조회
 * POST - /api/problem/group
 */
export const getGroupProblem = async (ctx) => {
  const { groupName } = ctx.request.body;
  const { user } = ctx.state;

  if (!user || !groupName) {
    ctx.status = 401;
    return;
  }
  try {
    const group = await Group.findOne({ groupName });
    // 그룹 멤버가 아닐 때
    if (!group.member.includes(user.username)) {
      ctx.status = 401;
      return;
    }
    ctx.status = 200;
    ctx.body = group.practice;
  } catch (err) {
    ctx.throw(500, err);
  }
};
