import {DocumentType, types} from '@typegoose/typegoose';
import {inject, injectable} from 'inversify';

import {UserService} from './user-service.interface.js';
import {CreateUserDto} from './dto/create-user.dto.js';
import {Component} from '../../types/index.js';
import {Logger} from '../../libs/logger/index.js';
import {UserEntity} from '../entities/index.js';

@injectable()
export class DefaultUserService implements UserService {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.UserModel) private readonly userModel: types.ModelType<UserEntity>,
  ) {
  }

  public async create(dto: CreateUserDto): Promise<DocumentType<UserEntity>> {
    const user = new UserEntity({...dto});

    const result = await this.userModel.create(user);
    this.logger.info(`New user created: ${user.userId}-${user.username}`);

    return result;
  }

  public async findOrCreate(dto: CreateUserDto): Promise<DocumentType<UserEntity>> {
    const existedUser = await this.findByUserId(dto.userId);

    if (existedUser) {
      return existedUser;
    }

    return this.create(dto);
  }

  public async findByUserId(userId: number): Promise<DocumentType<UserEntity> | null> {
    return this.userModel.findOne({ userId });
  }
}
