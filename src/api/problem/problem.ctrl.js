import Problem from '../../models/problem';
import User from '../../models/user';
import Group from '../../models/group';
import Rating from '../../models/rating';
import { fetchProblemInfo } from '../../lib/external/solvedac';
import { addToSolvedacQueue } from '../../lib/schedule';

/*
 * 문제 추가
 * PUT - /api/problem
 */
export const addProblem = async (ctx) => {
  const { problemId } = ctx.request.body;
  // 필수 항목 체크
  if (!problemId) {
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
    // 문제 정보를 가져옴
    const newProblem = await fetchProblemInfo(problemId);
    // 가져오는 데 실패
    if (newProblem.error) {
      ctx.status = 401;
      return;
    }

    const problem = new Problem({
      problemId,
      problemName: newProblem.data.title,
      solvedacTier: newProblem.data.level,
      tags: newProblem.data.tags,
    });
    problem.save();
    ctx.status = 201; // created
  } catch (err) {
    ctx.throw(500, err);
  }
};

/*
 * 문제 정보 수정
 * UPDATE - /api/problem/info
 */
export const updateProblemInfo = async (ctx) => {
  const { problemId } = ctx.request.body;
  if (!problemId) {
    ctx.status = 404;
    return;
  }
  try {
    // 문제 정보를 가져옴
    const newProblem = await fetchProblemInfo(problemId);
    // 가져오는 데 실패
    if (newProblem.error) {
      ctx.status = 401;
      return;
    }
    const problem = await Problem.findOneAndUpdate(
      { problemId },
      {
        $set: {
          problemName: newProblem.data.title,
          solvedacTier: newProblem.data.level,
          tags: newProblem.data.tags,
        },
      },
    );
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
 * 별점 정보 업데이트
 * UPDATE - /api/problem/rating
 */
export const updateProblemRating = async (ctx) => {
  const user = ctx.state.user;
  const { problemId, rating } = ctx.request.body;
  if (!problemId || !rating) {
    ctx.status = 404;
    return;
  }
  try {
    // 업데이트
    const problem = await Problem.findOne({ problemId });
    if (!problem) {
      ctx.status = 404;
      return;
    }

    const result = await Rating.findOneAndUpdate(
      { problemId, username: user.username },
      { rate: rating },
    );
    // 없으면 생성
    if (!result) {
      const newRate = new Rating({
        problemId,
        username: user.username,
        rate: rating,
      });
      await newRate.save();
    }
    ctx.status = 204; // No content
  } catch (err) {
    ctx.throw(500, err);
  }
};

/*
 * 사용자의 평점 정보 조회
 * POST - /api/problem/rating
 */
export const getUserRating = async (ctx) => {
  const user = ctx.state.user;

  try {
    const rating = await Rating.find({ username: user.username });
    const result = rating.map((item) => item.serialize());
    ctx.response.body = result;
    ctx.status = 200;
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
    const problem = await Problem.find({
      problemId: { $in: user.userData.solvedProblem },
    });
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

export const updateProblemFromSolvedac = async (ctx) => {
  const { problemId } = ctx.request.body;

  if (!problemId) {
    ctx.status = 401;
    return;
  }

  try {
    addToSolvedacQueue(problemId);
    ctx.status = 202;
  } catch (err) {
    ctx.throw(500, err);
  }
};
