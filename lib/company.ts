export type CompanyInput = {
  companyName: string;
  businessId: string;
  vatId?: string | null;
};

export function normalizeBusinessId(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function normalizeVatId(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase().replace(/\s+/g, "") ?? "";
  return normalized || null;
}

export function isValidFinnishBusinessId(value: string) {
  const normalized = normalizeBusinessId(value);
  const match = normalized.match(/^(\d{7})-(\d)$/);
  if (!match) return false;

  const weights = [7, 9, 10, 5, 8, 4, 2];
  const sum = match[1].split("").reduce((total, digit, index) => {
    return total + Number(digit) * weights[index];
  }, 0);
  const remainder = sum % 11;
  if (remainder === 1) return false;

  const expected = remainder === 0 ? 0 : 11 - remainder;
  return Number(match[2]) === expected;
}

export function cleanCompanyInput(input: Partial<CompanyInput>): CompanyInput & { businessIdNormalized: string; vatId: string | null } {
  const companyName = input.companyName?.trim() ?? "";
  const businessId = normalizeBusinessId(input.businessId ?? "");
  const vatId = normalizeVatId(input.vatId);

  return {
    companyName,
    businessId,
    businessIdNormalized: businessId,
    vatId
  };
}

export function getVatIdFromBusinessId(businessId: string) {
  return `FI${normalizeBusinessId(businessId).replace("-", "")}`;
}
