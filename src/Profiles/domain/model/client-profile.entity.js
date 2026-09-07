/**
 * ClientProfile Entity — editable client profile.
 * Layer: Profiles / domain / model
 */
export class ClientProfile {
  constructor({ name, phone, email }) {
    this.name  = name;
    this.phone = phone;
    this.email = email;
  }

  initials() {
    return (this.name || "U").split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase();
  }

  static fromApi(raw) {
    return new ClientProfile({ name: raw.name || "", phone: raw.phone || "", email: raw.email || "" });
  }
}
