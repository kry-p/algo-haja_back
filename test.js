const map = new Map();

const sleep = (time) => new Promise((res) => setTimeout(res, time));
const create = async () => {
  for (let i = 0; i < 100; i++) {
    map.set(i, new Date());
    await sleep(50);
  }
};

(async () => {
  await create();
  console.log(map);
})();
