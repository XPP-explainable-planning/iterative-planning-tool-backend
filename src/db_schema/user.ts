import mongoose, { Document, Schema } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

export interface User extends Document{
    name: string;
    password: string | null;
    tokens: { token: string }[];

    generateAuthToken: () => Promise<string>;
    findByCredentials: (username: string, password: string) => User;
}

const UserSchema =  new Schema<User>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minLength: 7
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});

UserSchema.pre('save', async function (next) {
    // Hash the password before saving the user model
    const user = this as User;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

UserSchema.methods.generateAuthToken = async function() {
    // Generate an auth token for the user
    const user = this;
    const token: string = jwt.sign({ _id: user._id}, process.env.JWT_KEY || '0' );
    user.tokens = user.tokens.concat([{ token }]);
    await user.save();
    return token;
};

UserSchema.statics.findByCredentials = async (username: string, password: string) => {

    console.log('find by credentials: ' + username);
    const user: User | null = await UserModel.findOne({ name: username} );
    if (!user) {
        throw new Error('Invalid login credentials');
    }
    if (! user.password){
        throw new Error('Invalid login credentials');
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        throw new Error('Invalid login credentials');
    }
    return user;
};

export const UserModel = mongoose.model<User>('User', UserSchema);

