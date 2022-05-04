import Joi from 'joi';

import User from '../../models/user';
import { passwordRegex } from '../../lib/constants';
// import sendMail from '../../lib/mail';

/*
 * 회원가입
 * POST - /api/auth/register
 */

export const register = async (ctx) => {
  const schema = Joi.object().keys({
    username: Joi.string().alphanum().min(4).max(20).required(),
    email: Joi.string().email().required(),
    password: Joi.string().regex(passwordRegex).required(),
  });
  const result = schema.validate(ctx.request.body);

  // 형식 검증에서 통과하지 못함
  if (result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }
  const { username, email, password } = ctx.request.body;
  try {
    const userExists = await User.findByUsername(username);
    const emailExists = await User.findByEmail(email);

    // 이미 존재하는 계정 이름임
    if (userExists || emailExists) {
      ctx.status = 409; // 409 Conflict
      return;
    }

    const user = new User({
      username,
      email,
      isAdmin: false,
      isEmailVerified: false,
      userData: {
        nickname: username,
        group: [],
        solvedacRating: 0,
        solvedProblem: [],
        triedProblem: [],
      },
      gitRepoInformation: {
        linked: false,
        repoURL: '',
        linkRule: -1,
      },
    });
    user.createVerificationToken();
    await user.setPassword(password);
    await user.save();

    ctx.body = user.serialize();

    const token = user.generateToken();
    ctx.cookies.set('access_token', token, {
      maxAge: 1000 * 60 * 60,
      httpOnly: true,
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

/*
 * 로그인
 * POST - /api/auth/login
 */
export const login = async (ctx) => {
  const { username, password } = ctx.request.body;
  if (!username || !password) {
    ctx.status = 401; // Unauthorized
    return;
  }
  try {
    const user = await User.findByUsername(username);
    if (!user) {
      ctx.status = 401;
      return;
    }
    const valid = await user.checkPassword(password);
    if (!valid) {
      ctx.status = 401;
      return;
    }
    ctx.body = user.serialize();
    const token = user.generateToken();
    ctx.cookies.set('access_token', token, {
      maxAge: 1000 * 60 * 60,
      httpOnly: true,
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

/*
 * 관리자 권한 부여 / 해제
 * POST - /api/auth/promote
 */
export const promote = async (ctx) => {
  const { promouser, value } = ctx.request.body;
  const currentuser = ctx.state.user.username;

  if (!currentuser) {
    ctx.status = 401;
    return;
  }

  if (!promouser) {
    ctx.status = 400;
  }

  try {
    const user = await User.findByUsername(promouser);
    const promoter = await User.findByUsername(currentuser);

    // 사용자가 존재하지 않음
    if (!user) {
      ctx.status = 401;
      return;
    }

    // 권한을 줄 사용자가 관리자가 아님
    if (!promoter.isAdmin) {
      ctx.status = 401;
      return;
    }

    await User.setUserAdmin(promouser, value);
    ctx.status = 200;
  } catch (e) {
    ctx.throw(500, e);
  }
};

/*
 * 세션 체크
 * GET - /api/auth/check
 */
export const check = async (ctx) => {
  const { user } = ctx.state;
  if (!user) {
    ctx.status = 401; // Unauthorized
    return;
  }
  ctx.body = user;
};

/*
 * 로그아웃
 * POST - /api/auth/logout
 */
export const logout = async (ctx) => {
  ctx.cookies.set('access_token');
  ctx.status = 204; // No content
};

/*
 * 메일 인증
 * GET - /api/auth/verify
 */
export const verify = async (ctx) => {
  const { username, token } = ctx.request.query;
  try {
    const user = await User.findByUsername(username);
    // 사용자가 없음
    if (!user) {
      ctx.status = 400;
      return;
    }

    // 이미 인증됨
    if (user.isEmailVerified) {
      ctx.status = 204;
      return;
    }

    const verified = await user.checkEmailToken(token);
    // 인증 키가 일치하지 않음
    if (!verified) {
      ctx.status = 400;
      return;
    }

    await User.setEmailVerified(username, true);
    ctx.status = 200;
  } catch (e) {
    ctx.throw(500, e);
  }
};
