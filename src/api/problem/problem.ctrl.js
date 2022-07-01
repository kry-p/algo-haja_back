import Problem from '../../models/problem';
import User from '../../models/user';
import Group from '../../models/group';
import Solve from '../../models/solve';
import Rating from '../../models/rating';
import { fetchProblemInfo } from '../../lib/external/solvedac';
import { addToSolvedacQueue } from '../../lib/schedule';
import { findGroupSource, findPersonalSource } from '../../lib/git';
import binarySearch from '../../lib/binarySearch';
import { NO_TRY, SOLVED, TRIED } from '../../lib/constants';

// 문제 상세정보 조회
// GET - /api/problem
export const getProblem = async (ctx) => {
  const { problemId } = ctx.params;
  const user = ctx.state.user;

  if (!problemId) {
    ctx.status = 401;
    return;
  }
  try {
    const problem = await Problem.findOne({ problemId });
    if (!problem) {
      ctx.status = 404;
      return;
    }
    if (!user) {
      const result = {
        problem,
        username: null,
        solve: null,
        userSolved: null,
        userTried: null,
      };
      ctx.body = result;
    } else {
      const currentUser = await User.findOne({ username: user.username });
      const solveDb = await Solve.find({
        $and: [{ username: user.username }, { problemId }],
      });
      const solvePersonalGit = currentUser.gitRepoInformation.linked
        ? findPersonalSource(
            user.username,
            problemId,
            currentUser.gitRepoInformation.bojDir,
          )
        : { data: [] };
      const solveGroupGit = [];
      for (const group of currentUser.userData.group) {
        const currentGroup = await Group.findOne({ groupName: group });
        // 찾는 그룹이 없음
        if (!group) {
          return;
        }
        const solve = findGroupSource(
          group,
          problemId,
          currentGroup.gitRepoInformation.bojDir,
        );
        if (solve.error) {
          return;
        }
        const result = solve.data
          .map((solve) => {
            const temp = solve;
            const actualUser = currentGroup.gitRepoInformation.memberName.find(
              (x) => x.nameInRepo == solve.user,
            );
            if (actualUser) {
              temp.actualUsername = actualUser.username;
            }
            return temp;
          })
          .filter(
            (solve) =>
              solve.actualUsername && solve.actualUsername != user.username,
          );

        solveGroupGit.push({
          groupName: group,
          solve: result,
        });
      }
      const result = {
        problem,
        username: user.username,
        solve: {
          user: [...solveDb, ...solvePersonalGit.data],
          group: solveGroupGit,
        },
        userSolved: currentUser.userData.solvedProblem.includes(problemId),
        userTried: currentUser.userData.triedProblem.includes(problemId),
      };
      ctx.body = result;
    }
    ctx.status = 200;
  } catch (err) {
    ctx.throw(500, err);
  }
};

/*
 * 문제 정보 업데이트 요청
 * POST - /api/problem/info
 */
export const updateProblemInfo = async (ctx) => {
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

// 내가 풀거나 시도한 문제
export const getUserSolvedOrTriedProblem = async (ctx) => {
  const { username } = ctx.state.user;

  try {
    const groupData = [];
    const user = await User.findOne({ username });
    if (!user) {
      ctx.status = 401;
      return;
    }
    const list = [
      ...user.userData.solvedProblem,
      ...user.userData.triedProblem,
    ];
    const unsortedProblems = await Problem.find()
      .in('problemId', list)
      .then((problems) => problems.map((problem) => problem.serialize()));
    const problems = unsortedProblems.sort((a, b) => a.problemId - b.problemId);

    for (const group of user.userData.group) {
      const currentGroup = await Group.findOne({ groupName: group });
      if (!currentGroup) {
        continue;
      }
      const users = await User.find({
        username: { $in: currentGroup.member },
      });
      if (users.length == 0) {
        continue;
      }
      let userSolved = [];
      let userTried = [];
      users.forEach((user) => {
        if (user.username !== username) {
          userSolved = userSolved.concat(user.userData.solvedProblem);
          userTried = userTried.concat(user.userData.triedProblem);
        }
      });
      userSolved = new Set(userSolved);
      userTried = userTried.filter((x) => !userSolved.has(x));
      groupData.push({
        groupName: group,
        solved: [...userSolved].sort((a, b) => a - b),
        tried: [...userTried].sort((a, b) => a - b),
      });
    }

    const result = problems.map((problem) => {
      const currentProblem = problem;
      problem.solved = {
        user:
          binarySearch(problem.problemId, user.userData.solvedProblem) > -1
            ? SOLVED
            : binarySearch(problem.problemId, user.userData.triedProblem) > -1
            ? TRIED
            : NO_TRY,
        group: [],
      };
      groupData.forEach((group) => {
        problem.solved.group.push([
          group.groupName,
          binarySearch(problem.problemId, group.solved) > -1
            ? SOLVED
            : binarySearch(problem.problemId, group.tried) > -1
            ? TRIED
            : NO_TRY,
        ]);
      });
      return currentProblem;
    });

    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    ctx.throw(500, err);
  }
};
