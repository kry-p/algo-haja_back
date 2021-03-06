/*
 * 사용자 정보 스키마
 */
// Mongoose
import mongoose, { Schema } from 'mongoose';
// Authentication
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Schema
const UserSchema = new Schema({
  username: String,
  hashedPassword: String,
  emailVerificationToken: String,
  email: String,
  isEmailVerified: Boolean,
  isAdmin: Boolean,
  isTestAccount: Boolean,
  userData: {
    group: [String],
    bojId: String,
    sourceOpened: Boolean,
    solvedacRating: Number,
    solvedProblem: [Number],
    triedProblem: [Number],
  },
  latestRequestSucceed: {
    boj: Boolean,
    solvedac: Boolean,
  },
  gitRepoInformation: {
    linked: Boolean,
    repoUrl: String,
    bojDir: String,
    linkRule: Number,
  },
});

// Methods
// 비밀번호 변경
UserSchema.methods.setPassword = async function (password) {
  const hash = await bcrypt.hash(password, 10);
  this.hashedPassword = hash;
};

// BOJ ID 변경
// 변경 시 푼 문제 목록은 초기화
UserSchema.methods.setBojId = async function (bojId) {
  this.userData.bojId = bojId;
  this.userData.solvedProblem = [];
  this.userData.triedProblem = [];
};

// 마지막 작업 성공 여부 기록
UserSchema.methods.setRequestSucceed = async function (site, succeed) {
  this.latestRequestSucceed[site] = succeed;
};

// solved.ac 티어 반영
UserSchema.methods.setSolvedacTier = async function (tier) {
  this.userData.solvedacRating = tier;
};

// 푼 문제 정보 반영
UserSchema.methods.setUserSolved = async function (solved) {
  this.userData.solvedProblem = solved.data.solved;
  this.userData.triedProblem = solved.data.wrong;
};

// 이메일 인증 토큰 생성
UserSchema.methods.createVerificationToken = function () {
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(Math.random(36).toString().slice(2))
    .digest('hex');
};

// 인증토큰 검증
UserSchema.methods.checkEmailToken = function (token) {
  const result = this.base.emailVerificationToken === token;
  return result;
};

// 비밀번호 검증
UserSchema.methods.checkPassword = async function (password) {
  const result = await bcrypt.compare(password, this.hashedPassword);
  return result;
};

// 반환 데이터 처리
UserSchema.methods.serializeAllData = function () {
  const data = this.toJSON();
  delete data.hashedPassword;
  delete data.emailVerificationToken;
  delete data.userData;
  delete data.latestRequestSucceed;
  delete data.gitRepoInformation;

  return data;
};

// JWT 토큰 생성
UserSchema.methods.generateToken = function () {
  const token = jwt.sign(
    {
      _id: this.id,
      username: this.username,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '1h',
    },
  );
  return token;
};

// 민감 데이터만 삭제
UserSchema.methods.serializePrivateData = function () {
  const data = this.toJSON();
  delete data.hashedPassword;
  delete data.emailVerificationToken;

  return data;
};

// Statics
// ID로 사용자 찾기
UserSchema.statics.findByUsername = function (username) {
  return this.findOne({ username: username });
};

// 이메일로 사용자 찾기
UserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email });
};

// 이메일 인증여부 검증
UserSchema.statics.setEmailVerified = async function (username, verified) {
  await this.findOneAndUpdate(
    { username: username },
    { isEmailVerified: verified },
    {
      returnOriginal: false,
    },
  );
};

// 사용자를 관리자로 설정
UserSchema.statics.setUserAdmin = async function (username, promoted) {
  await this.findOneAndUpdate(
    { username: username },
    { isAdmin: promoted },
    {
      returnOriginal: false,
    },
  );
};

const User = mongoose.model('User', UserSchema);

export default User;
