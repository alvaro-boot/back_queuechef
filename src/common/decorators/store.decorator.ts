import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Store = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const storeId = request.user?.storeId;
    console.log('Store decorator - request.user:', request.user);
    console.log('Store decorator - storeId extraído:', storeId);
    return storeId;
  },
);
