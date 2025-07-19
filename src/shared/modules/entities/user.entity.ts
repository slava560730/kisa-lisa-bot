import {defaultClasses, modelOptions, prop} from '@typegoose/typegoose';
import {User} from '../../types/user.type.js';


// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface UserEntity extends defaultClasses.Base {}

@modelOptions({
  schemaOptions: {
    collection: 'users',
    timestamps: true,
  }
})

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class UserEntity extends defaultClasses.TimeStamps implements User {
  constructor(userData: User) {
    super();

    this.userId = userData.userId;
    this.firstName = userData.firstName;
    this.lastName = userData.lastName;
    this.username = userData.username;
  }

  @prop({ type: Number, required: true, unique: true })
  public userId: number;

  @prop({ type: String})
  public firstName?: string;

  @prop({ type: String})
  public lastName?: string;

  @prop({ type: String})
  public username?: string;
}

