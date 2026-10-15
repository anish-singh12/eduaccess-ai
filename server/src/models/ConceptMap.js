import mongoose from 'mongoose';

const conceptMapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Concept map title is required'],
      trim: true,
      minlength: 1,
      maxlength: 120
    },
    topic: {
      type: String,
      default: 'General',
      trim: true,
      maxlength: 120
    },
    summary: {
      type: String,
      default: '',
      maxlength: 2000
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000
    },
    // Array of React Flow nodes { id, position, data: { label, description, category, keyPoints }, type }
    nodes: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0 && val.length <= 100;
        },
        message: 'Concept map must contain between 1 and 100 nodes'
      }
    },
    // Array of React Flow edges { id, source, target, label, animated }
    edges: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length <= 200;
        },
        message: 'Concept map cannot exceed 200 edges'
      }
    }
  },
  {
    timestamps: true
  }
);

conceptMapSchema.index({ userId: 1, updatedAt: -1 });

export const ConceptMap = mongoose.model('ConceptMap', conceptMapSchema);
