import Problem from '../../models/problem';
import User from '../../models/user';
import Group from '../../models/group';
import Rating from '../../models/rating';
import { fetchProblemInfo } from '../../lib/solvedac';

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

/*
 * 여기부터는 내부용 API
 */
export const updateProblemData = async () => {
  console.log('가져오지 않은 모든 문제를 solved.ac에서 가져옵니다.');
  const TIMER = 5;
  const sleep = (time) => new Promise((res) => setTimeout(res, time));
  const users = await User.find();
  const problems = await Problem.find();
  const problemSet = new Set(); // 사용자가 접근했던 전체 문제 목록

  users.map((user) => {
    user.userData.solvedProblem.map((problem) => {
      problemSet.add(problem);
    });
    user.userData.triedProblem.map((problem) => {
      problemSet.add(problem);
    });
  });

  // 이미 있는 정보는 다시 가져오지 않음
  problems.map((problem) => problemSet.delete(problem.problemId));
  const problemList = [...problemSet];

  if (problemList.length == 0) {
    console.log('모든 문제 정보를 가져왔습니다.');
    return;
  }

  console.log(
    `문제 정보를 가져옵니다. API call 주기는 ${TIMER}초로 설정되어 있습니다.`,
  );

  for (let index = 0; index < problemList.length; index++) {
    const problem = problemList[index];
    console.log(
      `${problem}번 문제 정보를 가져옵니다... (${index + 1} / ${
        problemList.length
      })`,
    );
    const info = await fetchProblemInfo(problem);
    // 가져오는 데 실패
    if (info.error) {
      console.log(`error code ${info.error.response.status}`);
      console.log('실패하였습니다. 다음으로 넘어갑니다.');
    } else {
      console.log('완료.');

      const newProblem = new Problem({
        problemId: problem,
        problemName: info.data.title,
        solvedacTier: info.data.level,
        tags: info.data.tags,
      });
      newProblem.save();
    }
    await sleep(TIMER * 1000);
  }
  console.log('작업 완료.');
};
