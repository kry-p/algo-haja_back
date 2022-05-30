import axios from 'axios';

const API_URL = 'https://solved.ac/api/v3/problem/show';

export const fetchProblemInfo = async (problemNo) => {
  try {
    const response = await axios.get(`${API_URL}?problemId=${problemNo}`);
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
