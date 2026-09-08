import type { Employe } from "./employe"

export interface Absence {
  id: number
  motif: string
  date: string
  employeId: number
  employe?: Employe
}

export interface AbsenceCreateData {
  employeId: number
  date: string
  motif?: string
}

export interface AbsenceUpdateData extends Partial<AbsenceCreateData> {}