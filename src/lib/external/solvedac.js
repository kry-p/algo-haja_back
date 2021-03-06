import axios from 'axios';

const PROBLEM_API_URL = 'https://solved.ac/api/v3/problem/show';
const USER_API_URL = 'https://solved.ac/api/v3/user/show';

/**
 * 문제 상세 정보를 solved.ac API에 요청
 * @param   {Number} problemNo
 * @returns Response (Problem)
 */
export const fetchProblemInfo = async (problemNo) => {
  try {
    const response = await axios.get(
      `${PROBLEM_API_URL}?problemId=${problemNo}`,
    );
    const title = response.data.titleKo; // 제목
    const level = response.data.level; // 티어
    const tags = response.data.tags.map((item) => item.key); // 태그

    return {
      result: 'success',
      data: {
        title,
        level,
        tags,
      },
      error: null,
    };
  } catch (e) {
    // 가져올 수 없을 경우
    return {
      result: 'error',
      data: null,
      error: e,
    };
  }
};

/**
 * 사용자 정보를 solved.ac API에 요청
 * @param   {String} bojId
 * @returns Response (User)
 */
export const fetchUserInfo = async (bojId) => {
  try {
    const response = await axios.get(`${USER_API_URL}?handle=${bojId}`);
    const tier = response.data.tier;
    return {
      result: 'success',
      data: {
        tier,
      },
      error: null,
    };
  } catch (e) {
    // 가져올 수 없을 경우
    return {
      result: 'error',
      data: null,
      error: e,
    };
  }
};
