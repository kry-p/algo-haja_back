/**
 * Git 저장소 관리 모듈
 */
import nodegit from 'nodegit';
import fs from 'fs';
import path from 'path';
import fileExtension from 'file-extension';
import { EXT_LANG } from './constants';

/**
 * 소스코드 파일 목록 작성
 * @param {String} destination
 * @param {Array} fileList
 * @return 주어진 경로 내의 소스코드 파일 목록을 반환합니다.
 */
const findSourceFile = (destination, fileList) => {
  try {
    fs.readdirSync(destination, { withFileTypes: true }).forEach((file) => {
      const path = `${destination}/${file.name}`;

      if (file.isDirectory()) {
        findSourceFile(path, fileList);
      } else {
        // 숨겨진 파일 제외
        if (!file.name.match(/^\./)) fileList.push(path);
      }
    });
  } catch (err) {
    return;
  }

  return fileList;
};

/**
 * 개인 리포지토리 복제
 * @param {String} link - 원격 리포지토리 링크
 * @param {String} username - 사용자 이름
 * @return 수행 결과를 객체로 반환합니다.
 * @brief 원격 리포지토리를 가져옵니다.
 */
export const clonePersonalRepository = async (link, username) => {
  try {
    await nodegit.Clone.clone(
      link,
      path.resolve(`./repos/personal/${username}`),
    );
    return {
      result: 'success',
      error: null,
    };
  } catch (err) {
    return {
      result: 'error',
      error: err,
    };
  }
};

/**
 * 개인 리포지토리 복제
 * @param {String} link - 원격 리포지토리 링크
 * @param {String} groupName - 그룹 이름
 * @return 수행 결과를 객체로 반환합니다.
 * @brief 원격 리포지토리를 가져옵니다.
 */
export const cloneGroupRepository = async (link, groupName) => {
  try {
    await nodegit.Clone.clone(link, path.resolve(`./repos/group/${groupName}`));
    return {
      result: 'success',
      error: null,
    };
  } catch (err) {
    return {
      result: 'error',
      error: err,
    };
  }
};

/**
 * 리포지토리 업데이트
 * @param {String} name - required
 * @param {String} remote - default: origin
 * @param {String} branch - default: master
 * @return 수행 결과를 객체로 반환합니다.
 * @brief 리포지토리를 업데이트합니다. remote, branch 값은 선택사항으로, 없을 시 기본값이 사용됩니다.
 */
export const updatePersonalRepository = async (
  isGroup,
  name,
  remote,
  branch,
) => {
  try {
    const repo = await nodegit.Repository.open(
      path.resolve(`./repos/${isGroup ? 'group' : 'personal'}/${name}`),
    );
    await repo.fetchAll(nodegit.CloneOptions.fetchOpts);
    await repo.mergeBranches(
      `${remote ? remote : 'master'}`,
      `refs/remotes/${remote}/${branch}`,
    );
    return {
      result: 'success',
      error: null,
    };
  } catch (err) {
    return {
      result: 'error',
      error: err,
    };
  }
};

/**
 * 개인 저장소 문제풀이 정보
 * @param {String} name - 사용자 이름
 * @param {Number} problemNo - 문제번호
 * @param {String} subDir - (optional) 여러 출처에서 받을 경우 백준 문제가 저장되는 디렉토리
 * @return 조건을 만족하는 풀이를 반환합니다.
 */
export const findPersonalSource = (name, problemNo, subDir) => {
  let fileList = [];
  let result = [];

  try {
    // 소스 파일 목록을 작성
    // 소스 파일 목록을 작성
    const sourcePath = subDir
      ? path.resolve(`./repos/personal/${name}`, subDir)
      : path.resolve(`./repos/personal/${name}`);
    findSourceFile(sourcePath, fileList);

    fileList.map((file) => {
      const extension = fileExtension(file);
      const split = file.split(/\/|\\/);
      const problem = parseInt(split[split.length - 2]);
      if (problem !== problemNo) {
        return;
      }
      result.push({
        name,
        language: EXT_LANG.get(extension),
        problemNo: problem,
        content: String.raw`${fs.readFileSync(file, 'utf-8')}`,
      });
    });

    return {
      result: 'success',
      data: result,
      error: null,
    };
  } catch (err) {
    return {
      result: 'error',
      data: null,
      error: err,
    };
  }
};

/**
 * 그룹 저장소 문제풀이 정보
 * @param {String} name - 그룹 이름
 * @param {Number} problemNo - 문제번호
 * @param {String} subDir - (optional) 여러 출처에서 받을 경우 백준 문제가 저장되는 디렉토리
 * @return 조건을 만족하는 풀이를 반환합니다.
 */
export const findGroupSource = (name, problemNo, subDir) => {
  let fileList = [];
  let result = [];

  try {
    // 소스 파일 목록을 작성
    const sourcePath = subDir
      ? path.resolve(`./repos/group/${name}`, subDir)
      : path.resolve(`./repos/group/${name}`);
    findSourceFile(sourcePath, fileList);

    fileList.map((file) => {
      const extension = fileExtension(file);
      const split = file.split(/\/|\\/);
      const problem = parseInt(split[split.length - 3]);
      if (problem !== problemNo) {
        return;
      }

      result.push({
        user: split[split.length - 2],
        language: EXT_LANG.get(extension),
        problemNo: problem,
        content: String.raw`${fs.readFileSync(file, 'utf-8')}`,
      });
    });

    return {
      result: 'success',
      data: result,
      error: null,
    };
  } catch (err) {
    return {
      result: 'error',
      data: null,
      error: err,
    };
  }
};
