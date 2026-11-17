import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateUserData {
  email: string;
  passwordHash?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isEmailVerified?: boolean;
  status?: string;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    return this.prisma.user.findUnique({
      where: { email: normalized },
    });
  }

  async create(data: CreateUserData) {
    const normalizedEmail = data.email.trim().toLowerCase();
    return this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: data.passwordHash || null,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        isEmailVerified: data.isEmailVerified ?? false,
        status: data.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, data: Partial<CreateUserData>) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.passwordHash !== undefined ? { passwordHash: data.passwordHash } : {}),
        ...(data.isEmailVerified !== undefined ? { isEmailVerified: data.isEmailVerified } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'SUSPENDED' },
    });
  }
}
