import mongoose, { Schema } from 'mongoose';

// Schema
const GroupSchema = new Schema({
  groupName: {
    type: String,
    required: true,
    unique: true,
  },
  isPublic: { type: Boolean, required: true },
  manager: { type: [String], required: true },
  member: { type: [String], required: true },
  pool: { type: [Number], required: true },
  practice: [
    {
      practiceName: { type: String, required: true, unique: true },
      start: { type: Date, required: true },
      end: { type: Date, required: true },
      problem: { type: [Number], required: true },
    },
  ],
  gitRepoInformation: {
    linked: Boolean,
    repoURL: String,
    linkRule: Number,
    memberName: [{ username: String, nameInRepo: String }],
  },
});

const Group = mongoose.model('Group', GroupSchema);

export default Group;
