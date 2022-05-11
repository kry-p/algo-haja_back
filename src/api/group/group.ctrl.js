import Group from '../../models/group';

/*
 * 그룹 생성
 * PUT - /api/group
 */
export const createGroup = async (ctx) => {
  const { groupName, isPublic, manager, member } = ctx.request.body;

  // 필수 항목 체크
  if (!groupName || !isPublic || !manager || !member) {
    ctx.status = 401;
    return;
  }

  try {
    const check = await Group.findOne({ groupName });
    if (check) {
      ctx.status = 409;
      return;
    }

    const group = new Group({
      groupName,
      isPublic,
      manager,
      member,
      pool: [],
      gitRepoInformation: {
        linked: false,
        repoURL: '',
        linkRule: -1,
        memberName: [],
      },
    });
    group.save();
    ctx.status = 201;
  } catch (err) {
    ctx.throw(500, err);
  }
};

/*
 * 그룹 정보 수정
 * PATCH - /api/group
 */
export const updateGroup = async (ctx) => {
  const { groupName, ...rest } = ctx.request.body;
  if (!groupName) {
    ctx.status = 401;
    return;
  }
  try {
    const update = rest;
    const group = await Group.findOneAndUpdate({ groupName }, update);
    if (!group) {
      ctx.status = 401;
      return;
    }

    ctx.status = 204;
  } catch (err) {
    ctx.throw(500, err);
  }
};

/*
 * 그룹 삭제
 * DELETE - /api/group
 */
export const deleteGroup = async (ctx) => {
  const { groupName } = ctx.request.body;
  if (!groupName) {
    ctx.status = 401;
    return;
  }
  try {
    const group = await Group.findOne({ groupName });
    if (!group) {
      ctx.status = 401;
      return;
    }
    await Group.findOneAndDelete({ groupName });
    ctx.status = 204;
  } catch (err) {
    ctx.throw(500, err);
  }
};
