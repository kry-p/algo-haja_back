const spawn = require('await-spawn');
const FILE_ROOT_DIR = process.cwd();

export const fetchUserSolved = async (username) => {
  try {
    const result = await spawn('python3', [
      `${FILE_ROOT_DIR}/src/lib/scrap.py`,
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
