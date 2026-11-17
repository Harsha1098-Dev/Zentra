import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { UsersRepository, CreateUserData } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(this.normalizeEmail(email));
  }

  async create(data: CreateUserData) {
    const normalizedEmail = this.normalizeEmail(data.email);
    const existing = await this.usersRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException('A user with this email address already exists');
    }

    return this.usersRepository.create({
      ...data,
      email: normalizedEmail,
    });
  }

  async update(id: string, data: Partial<CreateUserData>) {
    await this.findById(id);
    return this.usersRepository.update(id, data);
  }

  /**
   * Used during company invitation flow:
   * If a user with this email exists globally, return the existing user.
   * If no user exists, create an invited placeholder user.
   * Strictly prevents duplicate accounts.
   */
  async getOrCreateForInvitation(email: string, firstName?: string, lastName?: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const existing = await this.usersRepository.findByEmail(normalizedEmail);
    if (existing) {
      return { user: existing, isNew: false };
    }

    const newUser = await this.usersRepository.create({
      email: normalizedEmail,
      firstName: firstName || null,
      lastName: lastName || null,
      status: 'INVITED',
      isEmailVerified: false,
    });

    return { user: newUser, isNew: true };
  }
}
