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
  userData: {
    nickname: String,
    group: [String],
    solvedacRating: Number,
    solvedProblem: [Number],
    triedProblem: [Number],
  },
  gitRepoInformation: {
    linked: Boolean,
    repoURL: String,
    linkRule: Number,
  },
});

// Methods
// 비밀번호 변경
UserSchema.methods.setPassword = async function (password) {
  const hash = await bcrypt.hash(password, 10);
  this.hashedPassword = hash;
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
UserSchema.methods.serialize = function () {
  const data = this.toJSON();
  delete data.hashedPassword;
  delete data.emailVerificationToken;
  delete data.isEmailVerified;
  delete data.userData;
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
