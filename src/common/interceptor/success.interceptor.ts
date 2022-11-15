import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

/**
 * 요청에 대한 처리가 성공적으로 처리되었을 때 응답 처리
 */
@Injectable()
export class SuccessInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data): void => {
        const res: any = context.switchToHttp().getResponse();
        res.json(data);
      }),
    );
  }
}
