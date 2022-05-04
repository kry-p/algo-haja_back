import mongoose, { Schema } from 'mongoose';
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

UserSchema.methods.setPassword = async function (password) {
  const hash = await bcrypt.hash(password, 10);
  this.hashedPassword = hash;
};

UserSchema.methods.setEmailVerified = function (verified) {
  this.isEmailVerified = verified;
};

UserSchema.methods.createVerificationToken = function () {
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(Math.random(36).toString().slice(2))
    .digest('hex');
};

UserSchema.methods.checkEmailToken = function (token) {
  const result = this.base.emailVerificationToken === token;
  return result;
};

UserSchema.methods.checkPassword = async function (password) {
  const result = await bcrypt.compare(password, this.hashedPassword);
  return result;
};

UserSchema.methods.serialize = function () {
  const data = this.toJSON();
  delete data.hashedPassword;
  delete data.emailVerificationToken;
  delete data.isEmailVerified;
  delete data.userData;
  delete data.gitRepoInformation;

  return data;
};

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

UserSchema.statics.findByUsername = function (username) {
  return this.findOne({ username: username });
};

UserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email });
};

UserSchema.statics.setEmailVerified = async function (username, verified) {
  await this.findOneAndUpdate(
    { username: username },
    { isEmailVerified: verified },
    {
      returnOriginal: false,
    },
  );
};

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
