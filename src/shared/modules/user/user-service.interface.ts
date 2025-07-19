import {DocumentType} from '@typegoose/typegoose';
import {CreateUserDto} from './dto/create-user.dto.js';
import {UserEntity} from '../entities/index.js';

export interface UserService {
  create(dto: CreateUserDto): Promise<DocumentType<UserEntity>>;
  findOrCreate(dto: CreateUserDto): Promise<DocumentType<UserEntity>>;
  findByUserId(userId: number): Promise<DocumentType<UserEntity> | null>;
}
