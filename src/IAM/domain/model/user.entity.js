/**
 * User Entity — authenticated system user.
 * Layer: IAM / domain / model
 *
 * Represents the current user (customer or employee) and their 
 * identity data. Credential (token) information is stored separately.
 */
import { Role } from "./role.value.js";

export class User {
  constructor({ id, name, email, phone, role }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.role = role; // 'client' | 'worker'
  }

  isWorker() { return this.role === Role.WORKER; }
  isClient() { return this.role === Role.CLIENT; }

  /** Initials to display on avatars. */
  initials() {
    return (this.name || "U")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  /** Builds the User from the backend response. */
  static fromApi(raw) {
    if (!raw) return null;
    return new User({
      id: raw.id,
      name: raw.name,
      email: raw.email,
      phone: raw.phone,
      role: raw.role,
    });
  }
}
