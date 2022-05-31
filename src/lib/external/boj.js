const spawn = require('await-spawn');
const FILE_ROOT_DIR = process.cwd();

/**
 * 사용자가 풀이한 문제 정보 스크랩
 * @param   {String} username
 * @returns Response (result and data)
 */
export const fetchUserSolved = async (username) => {
  try {
    const result = await spawn('python3', [
      `${FILE_ROOT_DIR}/src/lib/external/scrap.py`,
      username,
    ]);
    return {
      result: 'success',
      data: JSON.parse(result.toString()),
      error: null,
    };
  } catch (e) {
    return {
      result: 'error',
      data: null,
      error: e,
    };
  }
};
