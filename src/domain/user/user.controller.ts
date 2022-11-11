import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async postUser() {
    const User = await this.userService.addUser();
    return { userId: User.userId };
  }
}
