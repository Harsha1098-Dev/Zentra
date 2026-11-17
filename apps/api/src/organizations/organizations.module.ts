import { Module, forwardRef } from '@nestjs/common';
import {
  OrganizationsController,
  InvitationsPublicController,
} from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { OrganizationsRepository } from './organizations.repository';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    forwardRef(() => MembershipsModule),
  ],
  controllers: [OrganizationsController, InvitationsPublicController],
  providers: [OrganizationsService, OrganizationsRepository],
  exports: [OrganizationsService, OrganizationsRepository],
})
export class OrganizationsModule {}
