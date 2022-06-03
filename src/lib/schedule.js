/**
 * 정보 가져오기 자동화 모듈
 */
import cron from 'node-cron';
import User from '../models/user';
import Problem from '../models/problem';
import { fetchUserSolved } from './external/boj';
import { fetchProblemInfo, fetchUserInfo } from './external/solvedac';
import { logger } from '../config/winston';

// 작업 큐
let bojQueue = new Map();
let solvedacQueue = new Map();

// 일정 시간 Suspend (API call limit 방지)
const sleep = (time) => new Promise((res) => setTimeout(res, time));

// 정보 업데이트 요청 시 가장 앞으로 보냄
export const addToSolvedacQueue = (problemId) => {
  solvedacQueue.set(problemId, 0);
};
export const addToBojQueue = (id) => {
  bojQueue.set(id, 0);
};

export const runScheduledJob = async () => {
  // Master crontab - 15분 단위로 최신 여부 체크
  cron.schedule('*/15 * * * *', async () => {
    await Promise.all(getProblemList(), getBojUserList());
  });

  // 문제 정보 업데이트
  cron.schedule('* * * * *', async () => {
    await sleep(5000);
    solvedacQueue = new Map(
      [...solvedacQueue.entries()].sort((a, b) => a[1] - b[1]),
    );
    const keys = Array.from(solvedacQueue.keys());
    for (let i = 0; i < (keys.length > 10 ? 10 : keys.length); i++) {
      const problem = keys[i];
      await retrieveProblemData(problem);
      await sleep(5000);
    }
  });

  // BOJ 정보 업데이트
  cron.schedule('* * * * *', async () => {
    await sleep(5000);
    bojQueue = new Map([...bojQueue.entries()].sort((a, b) => a[1] - b[1]));
    const keys = Array.from(bojQueue.keys());
    for (let i = 0; i < (keys.length > 5 ? 5 : keys.length); i++) {
      const bojId = keys[i];
      await retrieveBojUserData(bojId);
      await sleep(10000);
    }
  });
};

const getBojUserList = async () => {
  const users = await User.find();
  const bojUserList = users
    .filter((user) => user.userData.bojId !== '')
    .map((user) => user.userData.bojId);
  bojUserList.forEach((user) => bojQueue.set(user, new Date()));
};

const retrieveBojUserData = async (bojId) => {
  const user = await User.findOne({ 'userdata.bojId': bojId });
  if (!user) {
    logger.error(`추가하려는 사용자 ${username}가 없습니다. 건너뜁니다.`);
  }
  const username = user.username;
  logger.info(
    `BOJ User data retriever: ${username} 사용자의 정보를 가져옵니다...`,
  );
  bojQueue.delete(bojId);
  const info = await fetchUserSolved(bojId);
  const tier = await fetchUserInfo(bojId);

  // 가져오는 데 실패
  if (info.error || tier.error) {
    logger.error(`error code ${info.error.response.status}`);
    logger.warn(
      `BOJ User data retriever: ${username} 사용자 정보를 가져올 수 없습니다. 건너뜁니다.`,
    );
  } else {
    logger.info(
      `BOJ User data retriever: ${username} 사용자 정보를 가져왔습니다.`,
    );
  }

  if (!user) {
    logger.error(`추가하려는 사용자 ${username}가 없습니다. 건너뜁니다.`);
  }
  await user.setUserSolved(info);
  await user.setSolvedacTier(tier.data.tier);
  await User.updateOne({ username }, user);
  logger.info(
    `BOJ User data retriever: ${username} 사용자 정보를 업데이트했습니다.`,
  );
};

const getProblemList = async () => {
  const users = await User.find();
  const problems = await Problem.find();
  const problemSet = new Set();
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
  problemList.forEach((item) => solvedacQueue.set(item, new Date()));
};

const retrieveProblemData = async (problemId) => {
  logger.info(
    `Problem info retriever: ${problemId}번 문제 정보를 가져옵니다...`,
  );
  solvedacQueue.delete(problemId);
  const info = await fetchProblemInfo(problemId);

  // 가져오는 데 실패
  if (info.error) {
    logger.error(`error code ${info.error.response.status}`);
    logger.warn(
      `Problem info retriever: ${problemId}번 문제 정보를 가져올 수 없습니다. 건너뜁니다.`,
    );
  } else {
    logger.info(
      `Problem info retriever: ${problemId}번 문제 정보를 가져왔습니다.`,
    );
  }

  const problem = await Problem.findOne({ problemId });
  if (problem) {
    await problem.updateOne(
      { problemId },
      {
        problemName: info.data.title,
        solvedacTier: info.data.level,
        tags: info.data.tags,
      },
    );
    logger.info(
      `Problem info retriever: ${problemId}번 문제 정보를 업데이트했습니다.`,
    );
  } else {
    const newProblem = new Problem({
      problemId,
      problemName: info.data.title,
      solvedacTier: info.data.level,
      tags: info.data.tags,
    });
    await newProblem.save();
    logger.info(
      `Problem info retriever: ${problemId}번 문제 정보를 데이터베이스에 저장했습니다.`,
    );
  }
};
