const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    state: { type: String, required: true },
    district: { type: String, required: true },
    village: { type: String, required: true },
    role: { type: String, enum: ['farmer', 'admin'], default: 'farmer' },
    avatar: { type: String, default: '' },
    // NEW (optional, additive) — lets the automatic Pest Risk module default
    // to the farmer's usual crop. Existing users without this set are
    // unaffected; they simply pick a crop each time on the Pest Alerts page.
    primaryCrop: { type: String, default: '' },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
