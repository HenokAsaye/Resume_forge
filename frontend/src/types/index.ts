export interface User {
  id: string
  email: string
  name?: string
  created_at: string
}

export interface Resume {
  id: string
  user_id: string
  name: string
  original_file_url?: string
  parsed_json?: Record<string, unknown>
  created_at: string
}

export interface JobDescription {
  id: string
  user_id: string
  title: string
  company?: string
  raw_text?: string
  parsed_json?: Record<string, unknown>
  url?: string
  created_at: string
}

export interface ATSReport {
  id: string
  resume_id: string
  job_id: string
  match_score: number
  missing_keywords?: string[]
  suggestions?: string[]
  strengths?: string[]
  weaknesses?: string[]
  created_at: string
}

export interface JobApplication {
  id: string
  user_id: string
  job_id: string
  resume_version_id?: string
  status: "saved" | "applied" | "assessment" | "interview" | "offer" | "rejected"
  notes?: string
  applied_at?: string
  created_at: string
}
