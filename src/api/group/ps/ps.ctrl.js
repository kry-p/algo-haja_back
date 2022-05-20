import Group from '../../../models/group';

/*
 * 그룹 연습 생성
 * PUT - /api/group/ps
 */
export const createGroupPractice = async (ctx) => {
  const { groupName, practiceName, start, end, problem } = ctx.request.body;

  if (!groupName || !practiceName || !start || !end || !problem) {
    ctx.status = 401;
    return;
  }

  try {
    const check = await Group.findOne({
      $and: [{ groupName }, { practice: { $elemMatch: { practiceName } } }],
    });
    if (check) {
      ctx.status = 409;
      return;
    }
    const group = await Group.findOne({ groupName });
    group.practice.push({ practiceName, start, end, problem });
    group.save();
    ctx.status = 204;
  } catch (err) {
    ctx.throw(500, err);
  }
};

/*
 * 그룹 연습 목록 가져오기
 * POST - /api/group/ps/list
 */
export const getGroupPracticeList = async (ctx) => {
  const { groupName } = ctx.request.body;

  if (!groupName) {
    ctx.status = 401;
    return;
  }

  try {
    // 찾는 그룹이 있는지 체크
    const group = await Group.findOne({ groupName });
    if (!group) {
      ctx.status = 401;
      return;
    }
    ctx.body = group.practice;
    ctx.status = 200;
  } catch (err) {
    ctx.throw(500, err);
  }
};

/*
 * 문제 풀에서 그룹 연습 생성
 * PUT - /api/group/ps/pool
 */
export const createGroupPracticeFromPool = async (ctx) => {
  const { groupName, practiceName, start, end, problem } = ctx.request.body;

  if (!groupName || !practiceName || !start || !end || !problem) {
    ctx.status = 401;
    return;
  }

  try {
    const check = await Group.findOne({
      $and: [{ groupName }, { practice: { $elemMatch: { practiceName } } }],
    });
    if (check) {
      ctx.status = 409;
      return;
    }
    const group = await Group.findOne({ groupName });
    group.practice.push({ practiceName, start, end, problem });
    problem.map((item) => group.pool.pull(item));

    group.save();
    ctx.status = 204;
  } catch (err) {
    ctx.throw(500, err);
  }
};

/*
 * 그룹 연습 수정
 * PATCH - /api/group/ps
 */
export const updateGroupPractice = async (ctx) => {
  const { groupName, practiceName, newPracticeName, start, end, problem } =
    ctx.request.body;
  if (!groupName || !practiceName) {
    ctx.status = 401;
    return;
  }
  try {
    // 변경하려는 그룹에 연습이 있는지 확인
    const check = await Group.findOne({
      $and: [{ groupName }, { practice: { $elemMatch: { practiceName } } }],
    });
    // 없으면 종료
    if (!check) {
      ctx.status = 401;
      return;
    }
    await Group.updateOne(
      { $and: [{ groupName }, { practice: { $elemMatch: { practiceName } } }] },
      {
        $set: {
          'practice.$.practiceName': newPracticeName,
          'practice.$.start': start,
          'practice.$.end': end,
          'practice.$.problem': problem,
        },
      },
    );
    ctx.status = 204;
  } catch (err) {
    ctx.throw(500, err);
  }
};

/*
 * 그룹 연습 삭제
 * DELETE - /api/group/ps
 */
export const deleteGroupPractice = async (ctx) => {
  const { groupName, practiceName } = ctx.request.body;
  if (!groupName || !practiceName) {
    ctx.status = 401;
    return;
  }
  try {
    // 변경하려는 그룹에 연습이 있는지 확인
    const group = await Group.findOne({
      $and: [{ groupName }, { practice: { $elemMatch: { practiceName } } }],
    });
    // 없으면 종료
    if (!group) {
      ctx.status = 401;
      return;
    }
    await Group.updateOne(
      { $and: [{ groupName }, { practice: { $elemMatch: { practiceName } } }] },
      { $pull: { practice: { practiceName } } },
    );

    ctx.status = 204;
  } catch (err) {
    ctx.throw(500, err);
  }
};
