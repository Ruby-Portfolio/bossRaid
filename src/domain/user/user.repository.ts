import { Repository } from 'typeorm';
import { CustomRepository } from '../../module/typeOrm/customRepository.decorator';
import { User } from './user.entity';

@CustomRepository(User)
export class UserRepository extends Repository<User> {}
