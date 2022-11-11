import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigModule } from '@nestjs/config';
import { UserRepository } from '../../../src/domain/user/user.repository';
import { CustomTypeOrmModule } from '../../../src/module/typeOrm/customTypeOrm.module';
import { UserModule } from '../../../src/domain/user/user.module';
import { User } from '../../../src/domain/user/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { BossRaid } from '../../../src/domain/bossRaid/bossRaid.entity';
import { RaidRecord } from '../../../src/domain/raidRecord/raidRecord.entity';

describe('UserController', () => {
  let app: NestFastifyApplication;
  let userRepository: UserRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
          entities: [User, BossRaid, RaidRecord],
          synchronize: true,
          logging: true,
        }),
        UserModule,
        CustomTypeOrmModule.forCustomRepository([UserRepository]),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    userRepository = module.get<UserRepository>(UserRepository);
  });

  describe('POST /user - 유저 생성', () => {
    beforeAll(async () => {
      await userRepository.delete({});
    });

    test('유저 생성 성공', async () => {
      const res = await request(app.getHttpServer())
        .post('/user')
        .expect(HttpStatus.CREATED);

      const users: User[] = await userRepository.find();

      expect(res.body.userId).toEqual(users[0].userId);
    });
  });
});
