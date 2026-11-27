/**
 * Catálogo de preguntas frecuentes (US38).
 * Capa: Support / domain / model
 *
 * Categorías e identificadores son los de la app móvil (SupportFaq.kt), para unir sus
 * eventos. Los textos están en i18n: support.categories.<id> y support.items.<id>.
 */
export const FaqCategory = Object.freeze({
  BOOKINGS: "bookings",
  ACCOUNT: "account_access",
  WORKERS: "workers",
  MEMBERSHIPS: "memberships",
});

export const FAQ_CATEGORIES = Object.freeze(Object.values(FaqCategory));

const item = (id, category) => Object.freeze({ id, category });

export const FAQ_ITEMS = Object.freeze([
  item("bookings-amount", FaqCategory.BOOKINGS),
  item("bookings-cancel", FaqCategory.BOOKINGS),
  item("bookings-review", FaqCategory.BOOKINGS),
  item("account-code", FaqCategory.ACCOUNT),
  item("account-attempts", FaqCategory.ACCOUNT),
  item("workers-contact", FaqCategory.WORKERS),
  item("workers-verified", FaqCategory.WORKERS),
  item("memberships-pending", FaqCategory.MEMBERSHIPS),
]);

export const faqByCategory = (category) => FAQ_ITEMS.filter((faq) => faq.category === category);

export const isFaqCategory = (value) => FAQ_CATEGORIES.includes(value);
