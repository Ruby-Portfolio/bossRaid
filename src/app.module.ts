import { CacheModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BossRaid } from './domain/bossRaid/bossRaid.entity';
import { RaidRecord } from './domain/raidRecord/raidRecord.entity';
import { User } from './domain/user/user.entity';
import { UserModule } from './domain/user/user.module';
import { BossRaidModule } from './domain/bossRaid/bossRaid.module';
import { RaidRecordModule } from './domain/raidRecord/raidRecord.module';
import * as redisStore from 'cache-manager-ioredis';

@Module({
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
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      ttl: +process.env.REDIS_TTL,
      isGlobal: true,
    }),
    UserModule,
    BossRaidModule,
    RaidRecordModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
