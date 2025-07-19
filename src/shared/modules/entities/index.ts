import {getModelForClass} from '@typegoose/typegoose';
import {UserEntity} from './user.entity.js';

export const UserModel = getModelForClass(UserEntity);

export { UserEntity };
