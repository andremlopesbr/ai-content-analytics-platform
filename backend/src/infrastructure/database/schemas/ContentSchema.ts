import mongoose, { Schema, Document } from 'mongoose';

export interface IContentDocument extends Document {
  _id: string;
  title: string;
  content: string;
  url: string;
  author?: string;
  publishedAt?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema = new Schema<IContentDocument>({
  _id: { type: String, required: true },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: [1, 'Title cannot be empty'],
    maxlength: [500, 'Title cannot exceed 500 characters']
  },
  content: {
    type: String,
    required: true,
    minlength: [1, 'Content cannot be empty']
  },
  url: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function (v: string) {
        // Basic URL validation
        return /^https?:\/\/.+/.test(v);
      },
      message: 'URL must be a valid HTTP or HTTPS URL'
    }
  },
  author: {
    type: String,
    trim: true,
    maxlength: [200, 'Author name cannot exceed 200 characters']
  },
  publishedAt: {
    type: Date,
    validate: {
      validator: function (v: Date) {
        return v <= new Date();
      },
      message: 'Published date cannot be in the future'
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters'],
    validate: {
      validator: function (v: string) {
        return v.length > 0;
      },
      message: 'Tag cannot be empty'
    }
  }],
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  _id: false // Use custom _id
});

// Single-field indexes for performance
ContentSchema.index({ author: 1 });
ContentSchema.index({ publishedAt: -1 });
ContentSchema.index({ tags: 1 });

// Compound and unique indexes for common queries
ContentSchema.index({ url: 1 }, { unique: true });
ContentSchema.index({ author: 1, publishedAt: -1 });
ContentSchema.index({ tags: 1, publishedAt: -1 });

export default mongoose.model<IContentDocument>('Content', ContentSchema);