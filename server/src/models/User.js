import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false // Exclude from queries by default for security
    },
    themePreference: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    accessibilityPreferences: {
      fontSize: {
        type: String,
        enum: ['normal', 'medium', 'large', 'x-large'],
        default: 'normal'
      },
      lineSpacing: {
        type: String,
        enum: ['normal', 'relaxed', 'loose'],
        default: 'normal'
      },
      contentWidth: {
        type: String,
        enum: ['normal', 'comfortable', 'narrow'],
        default: 'normal'
      },
      dyslexiaFont: {
        type: Boolean,
        default: false
      },
      highContrast: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true
  }
);

// Method to verify password securely
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Safe JSON serialization excluding password hash
userSchema.methods.toSafeJSON = function () {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.__v;
  return user;
};

// Static helper to hash passwords
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainPassword, salt);
};

export const User = mongoose.model('User', userSchema);
