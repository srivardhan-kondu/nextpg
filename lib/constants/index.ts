import type { Category, CollegeType, Gender, PreferredCollegeType, QuotaType, SubCategory } from '@prisma/client';

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

export const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'EWS', label: 'EWS' },
  { value: 'OBC', label: 'OBC' },
  { value: 'SC', label: 'SC' },
  { value: 'ST', label: 'ST' },
];

export const SUB_CATEGORY_OPTIONS: { value: SubCategory; label: string }[] = [
  { value: 'NONE', label: 'None' },
  { value: 'PWD', label: 'PwD (Person with Disability)' },
  { value: 'ARMED_FORCES', label: 'Armed Forces (CW)' },
  { value: 'NRI', label: 'NRI' },
  { value: 'MANAGEMENT', label: 'Management' },
  { value: 'MINORITY', label: 'Minority' },
];

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

export const PREFERRED_TYPE_OPTIONS: { value: PreferredCollegeType; label: string; hint: string }[] = [
  { value: 'GOVERNMENT', label: 'Government', hint: 'Lowest fees, highest competition' },
  { value: 'PRIVATE', label: 'Private', hint: 'Higher fees, wider availability' },
  { value: 'DEEMED', label: 'Deemed', hint: 'No domicile requirement' },
  { value: 'DNB', label: 'DNB', hint: 'Hospital-based training' },
  { value: 'ANY', label: 'Any', hint: 'Show me everything' },
];

export const COLLEGE_TYPE_LABEL: Record<CollegeType, string> = {
  GOVERNMENT: 'Government',
  PRIVATE: 'Private',
  DEEMED: 'Deemed',
  DNB: 'DNB',
};

export const QUOTA_LABEL: Record<QuotaType, string> = {
  AIQ: 'AIQ',
  STATE: 'State',
  DEEMED: 'Deemed',
  MANAGEMENT: 'Management',
  NRI: 'NRI',
  INSTITUTIONAL: 'Institutional',
};

export const CATEGORY_LABEL: Record<Category, string> = {
  GENERAL: 'General',
  EWS: 'EWS',
  OBC: 'OBC',
  SC: 'SC',
  ST: 'ST',
};

/** Dream Validator branch dropdown — order matches the product spec. */
export const BRANCHES = [
  'General Medicine', 'Pediatrics', 'Radiology', 'Dermatology', 'Psychiatry',
  'Orthopedics', 'General Surgery', 'Anaesthesia', 'Pathology', 'ENT',
  'Ophthalmology', 'Emergency Medicine', 'Respiratory Medicine', 'Family Medicine',
  'Community Medicine', 'Microbiology', 'Pharmacology', 'Anatomy', 'Physiology',
  'Biochemistry',
] as const;

export type BranchName = (typeof BRANCHES)[number];

/**
 * Relative competitiveness, 1 (most competitive) → 20 (least).
 * Used only to shape the *fallback* estimate when a college × branch has no
 * cutoff row; a real cutoff always wins. See services/prediction.
 */
export const BRANCH_COMPETITIVENESS: Record<BranchName, number> = {
  Radiology: 1,
  Dermatology: 2,
  'General Medicine': 3,
  Pediatrics: 4,
  'General Surgery': 5,
  Orthopedics: 6,
  Psychiatry: 7,
  Anaesthesia: 8,
  'Emergency Medicine': 9,
  Ophthalmology: 10,
  ENT: 11,
  'Respiratory Medicine': 12,
  Pathology: 13,
  'Family Medicine': 14,
  'Community Medicine': 15,
  Microbiology: 16,
  Pharmacology: 17,
  Biochemistry: 18,
  Physiology: 19,
  Anatomy: 20,
};

export const CLINICAL_BRANCHES: BranchName[] = [
  'General Medicine', 'Pediatrics', 'Radiology', 'Dermatology', 'Psychiatry',
  'Orthopedics', 'General Surgery', 'Anaesthesia', 'ENT', 'Ophthalmology',
  'Emergency Medicine', 'Respiratory Medicine', 'Family Medicine',
];

export const LIKELIHOOD_META = {
  STRONG: { label: 'Strong Chance', tone: 'strong', min: 70 },
  MODERATE: { label: 'Moderate Chance', tone: 'moderate', min: 45 },
  STRETCH: { label: 'Stretch Chance', tone: 'stretch', min: 20 },
  VERY_DIFFICULT: { label: 'Very Difficult', tone: 'stretch', min: 0 },
} as const;

export const BAND_META = {
  STRONG: {
    title: 'Strong Possibilities',
    caption: 'These colleges and branches are within your likely range.',
  },
  MODERATE: {
    title: 'Moderate Possibilities',
    caption: 'These are possible with some variation in rank.',
  },
  STRETCH: {
    title: 'Stretch Possibilities',
    caption: 'These may be difficult but still worth considering.',
  },
} as const;

/**
 * Nomenclature used by counselling authorities, mapped to our branch names.
 *
 * MCC and the state bodies do not use the names in `BRANCHES`: they write
 * "MD Radiodiagnosis" for Radiology, "Paediatrics" for Pediatrics, "Pulmonary
 * Medicine" for Respiratory Medicine. Without this, roughly half of every real
 * import lands in the review queue purely over spelling.
 *
 * These are curated by us, not inferred by a model — an alias is a decision
 * about equivalence, and getting one wrong silently files cutoffs under the
 * wrong speciality.
 */
export const BRANCH_ALIASES: Record<BranchName, string[]> = {
  Radiology: ['Radiodiagnosis', 'Radio Diagnosis', 'Radio-Diagnosis', 'Radiotherapy Diagnosis'],
  Dermatology: [
    'Dermatology Venereology and Leprosy', 'Dermatology Venereology & Leprosy',
    'DVL', 'Skin and VD', 'Skin & VD', 'Venereology',
  ],
  'General Medicine': ['Internal Medicine', 'Gen Medicine', 'Medicine'],
  Pediatrics: ['Paediatrics', 'Child Health'],
  'General Surgery': ['Gen Surgery', 'Surgery'],
  Orthopedics: ['Orthopaedics', 'Ortho', 'Orthopaedic Surgery'],
  Psychiatry: ['Psychological Medicine'],
  Anaesthesia: ['Anaesthesiology', 'Anesthesiology', 'Anesthesia'],
  Pathology: ['Laboratory Medicine'],
  ENT: ['Otorhinolaryngology', 'Oto Rhino Laryngology', 'Oto-Rhino-Laryngology', 'ENT Surgery'],
  Ophthalmology: ['Eye', 'Ophthalmic Medicine'],
  'Emergency Medicine': ['Accident and Emergency', 'Emergency and Critical Care'],
  'Respiratory Medicine': [
    'Pulmonary Medicine', 'TB and Chest', 'TB & Chest',
    'Tuberculosis and Respiratory Diseases', 'Pulmonary Medicine and Tuberculosis',
  ],
  'Family Medicine': ['General Practice'],
  'Community Medicine': [
    'Preventive and Social Medicine', 'Social and Preventive Medicine', 'PSM', 'Public Health',
  ],
  Microbiology: ['Medical Microbiology'],
  Pharmacology: ['Clinical Pharmacology'],
  Anatomy: ['Human Anatomy'],
  Physiology: ['Human Physiology'],
  Biochemistry: ['Medical Biochemistry'],
};

/** Degree prefixes counselling documents put in front of the speciality. */
export const DEGREE_PREFIXES = ['MD', 'MS', 'DNB', 'Diploma', 'M.D.', 'M.S.', 'PG Diploma'];
