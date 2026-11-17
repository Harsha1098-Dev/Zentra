import { Injectable } from '@nestjs/common';
import { PermissionsRepository } from './permissions.repository';

@Injectable()
export class PermissionsService {
  constructor(private readonly permissionsRepository: PermissionsRepository) {}

  async getAllPermissions() {
    return this.permissionsRepository.findAll();
  }

  async getPermissionByCode(code: string) {
    return this.permissionsRepository.findByCode(code);
  }
}
