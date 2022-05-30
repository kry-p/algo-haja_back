/*
 * 평점 정보 스키마
 */
// Mongoose
import mongoose, { Schema } from 'mongoose';

// Schema
const RatingSchema = new Schema({
  problemId: Number,
  username: String,
  rate: Number,
});

// 불필요한 데이터는 지우고 보냄
RatingSchema.methods.serialize = function () {
  const data = this.toJSON();
  delete data.__v;
  delete data._id;
  delete data.username;
  return data;
};

const Rating = mongoose.model('Rating', RatingSchema);

export default Rating;
