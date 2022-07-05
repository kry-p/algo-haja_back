/**
 * 정보 가져오기 자동화 모듈
 */
import cron from 'node-cron';
import User from '../models/user';
import Problem from '../models/problem';
import { fetchUserSolved } from './external/boj';
import { fetchProblemInfo, fetchUserInfo } from './external/solvedac';
import { logger } from '../config/winston';
import { BOJ_TAGS } from './constants';
import { updatePersonalRepository } from './git';

// 일정 시간 Suspend (API call limit 방지)
const sleep = (time) => new Promise((res) => setTimeout(res, time));

// 정보 업데이트 요청 시 가장 앞으로 보냄
export const addToSolvedacQueue = (problemId) => {
  global.solvedacQueue.set(problemId, 0);
};
export const addToBojQueue = (id) => {
  global.bojQueue.set(id, 0);
};
export const addToGitUserQueue = (username) => {
  global.gitUserQueue.set(username, 0);
};

export const runScheduledJob = async () => {
  // Master crontab - 15분 단위로 최신 여부 체크
  cron.schedule('*/15 * * * *', async () => {
    await Promise.all(getProblemList(), getBojUserList(), getGitRepoUserList());
  });

  // 문제 정보 업데이트
  cron.schedule('* * * * *', async () => {
    await sleep(5000);
    global.solvedacQueue = new Map(
      [...global.solvedacQueue.entries()].sort((a, b) => a[1] - b[1]),
    );
    const keys = Array.from(global.solvedacQueue.keys());
    for (let i = 0; i < (keys.length > 10 ? 10 : keys.length); i++) {
      const problem = keys[i];
      await retrieveProblemData(problem);
      await sleep(5000);
    }
  });

  // BOJ 정보 업데이트
  cron.schedule('* * * * *', async () => {
    await sleep(5000);
    global.bojQueue = new Map(
      [...global.bojQueue.entries()].sort((a, b) => a[1] - b[1]),
    );
    const keys = Array.from(global.bojQueue.keys());
    for (let i = 0; i < (keys.length > 5 ? 5 : keys.length); i++) {
      const bojId = keys[i];
      await retrieveBojUserData(bojId);
      await sleep(10000);
    }
  });

  // Git repo 업데이트
  cron.schedule('* * * * *', async () => {
    await sleep(5000);
    global.gitUserQueue = new Map(
      [...global.gitUserQueue.entries()].sort((a, b) => a[1] - b[1]),
    );
    const keys = Array.from(global.gitUserQueue.keys());
    for (let i = 0; i < (keys.length > 5 ? 5 : keys.length); i++) {
      const user = keys[i];
      await retrieveGitData(user);
      await sleep(10000);
    }
  });
};

const getBojUserList = async () => {
  const users = await User.find();
  const bojUserList = users
    .filter((user) => user.userData.bojId !== '')
    .map((user) => user.userData.bojId);
  bojUserList.forEach((user) => global.bojQueue.set(user, new Date()));
};

const getGitRepoUserList = async () => {
  const users = await User.find();
  const gitRepoList = users
    .filter((user) => user.gitRepoInformation.linked)
    .map((user) => user.username);
  gitRepoList.forEach((user) => global.gitUserQueue.set(user, new Date()));
};

const retrieveGitData = async (user) => {
  logger.info(
    `Git personal repo retriever: ${user} 사용자의 저장소에서 가져옵니다...`,
  );
  global.gitUserQueue.delete(user);
  const info = await updatePersonalRepository(false, user);

  // 가져오는 데 실패
  if (info.error) {
    logger.warn(
      `Git personal repo retriever: ${user} 사용자의 Git 저장소를 업데이트할 수 없습니다. 건너뜁니다.`,
    );
  } else {
    logger.info(
      `Git personal repo retriever: ${user} 사용자의 Git 저장소를 업데이트했습니다.`,
    );
  }
};

const retrieveBojUserData = async (bojId) => {
  const users = await User.find({ 'userData.bojId': bojId });
  if (users.length === 0) {
    logger.error(
      `BOJ / solved.ac User data retriever: ${bojId}에 해당하는 사용자가 없습니다. 건너뜁니다.`,
    );
  }

  for (const user of users) {
    const username = user.username;
    logger.info(
      `BOJ / solved.ac User data retriever: ${username} 사용자의 정보를 가져옵니다...`,
    );
    global.bojQueue.delete(bojId);
    const solvedData = await fetchUserInfo(bojId);
    const bojData = await fetchUserSolved(bojId);

    if (solvedData.error) {
      logger.error(`error code ${solvedData.error.response.status}`);
      await user.setRequestSucceed('solvedac', false);
    } else {
      await user.setRequestSucceed('solvedac', true);
      await user.setSolvedacTier(solvedData.data.tier);
    }
    // 가져오는 데 실패
    if (bojData.error) {
      logger.error(
        `BOJ User data retriever: error code ${bojData.error.response.status}`,
      );
      await user.setRequestSucceed('boj', false);
    } else {
      await user.setRequestSucceed('boj', true);
      await user.setUserSolved(bojData);
    }

    await User.updateOne({ username }, user);
    logger.info(
      `BOJ / solved.ac User data retriever: ${username} 사용자 정보를 업데이트했습니다.`,
    );
    logger.info(
      `BOJ / solved.ac User data retriever: BOJ: ${
        bojData.error ? '실패' : '성공'
      }, solved.ac: ${solvedData.error ? '실패' : '성공'}.`,
    );
    await sleep(5000);
  }
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
  problemList.forEach((item) => global.solvedacQueue.set(item, new Date()));
};

const retrieveProblemData = async (problemId) => {
  logger.info(
    `Problem info retriever: ${problemId}번 문제 정보를 가져옵니다...`,
  );
  global.solvedacQueue.delete(problemId);
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
        tags: {
          en: info.data.tags,
          ko: info.data.tags.map((tag) =>
            BOJ_TAGS[tag] ? BOJ_TAGS[tag] : tag,
          ),
        },
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
      tags: {
        en: info.data.tags,
        ko: info.data.tags.map((tag) => (BOJ_TAGS[tag] ? BOJ_TAGS[tag] : tag)),
      },
    });
    await newProblem.save();
    logger.info(
      `Problem info retriever: ${problemId}번 문제 정보를 데이터베이스에 저장했습니다.`,
    );
  }
};
