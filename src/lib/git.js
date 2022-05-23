import NodeGit from 'nodegit';

/*
 * Clone repositories
 */
export const clonePersonalRepository = async (link, username) => {
  await NodeGit.Clone.clone(link, `./repos/personal/${username}`);
};

export const cloneGroupRepository = async (link, groupName) => {
  await NodeGit.Clone.clone(link, `./repos/group/${groupName}`);
};
