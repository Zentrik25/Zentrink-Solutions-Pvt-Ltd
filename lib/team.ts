/**
 * Engineering team. Only confirmed facts are listed. Add `qualifications`
 * and `bio` for a person once they have been supplied and verified.
 */
export type TeamMember = {
  name: string;
  role: string;
  qualifications?: string;
  bio?: string;
};

export const TEAM: TeamMember[] = [
  { name: "Strive Chitakatira", role: "Engineer" },
  { name: "Eulogy Nyanisi", role: "Engineer" },
  { name: "Justin Lufasi", role: "Engineer" },
];
