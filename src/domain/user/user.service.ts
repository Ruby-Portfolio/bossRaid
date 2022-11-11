import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}
  async addUser(): Promise<User> {
    const userId: number = new Date().getTime();

    return this.userRepository.create({ userId });
  }
}
