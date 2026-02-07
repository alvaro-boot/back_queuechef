import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class StoreFilterInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const storeId = request.user?.storeId;

    return next.handle().pipe(
      map((data) => {
        if (Array.isArray(data)) {
          return data.filter((item) => {
            if (item.store_id !== undefined) {
              return item.store_id === storeId;
            }
            if (item.store?.id !== undefined) {
              return item.store.id === storeId;
            }
            return true;
          });
        }
        return data;
      }),
    );
  }
}
