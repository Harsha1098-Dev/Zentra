import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContext } from '../context/tenant-context';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request?.user;
    const organizationId = user?.organizationId || null;
    const userId = user?.id || null;

    return new Observable((subscriber) => {
      TenantContext.run({ organizationId, userId }, () => {
        // Also proactively set app.current_organization_id in the connection session if organizationId is present
        if (organizationId) {
          this.prisma.setTenantContext(organizationId).catch(() => {
            // Non-blocking in case of connection edge cases
          });
        }
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
