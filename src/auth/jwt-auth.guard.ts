import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable, from } from 'rxjs';
import { firstValueFrom } from 'rxjs';


@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
}
