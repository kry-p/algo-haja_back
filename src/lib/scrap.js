const spawn = require('child_process').spawn;
const FILE_ROOT_DIR = process.cwd();

export const fetchUserSolved = (username) => {
  const result = spawn('python3', [
    `${FILE_ROOT_DIR}/src/lib/scrap.py`,
    username,
  ]);

  result.stdout.on('data', (result) => {
    const json = JSON.parse(result.toString());
    console.log(json);
  });
};
