import { gql } from '@apollo/client';

export const THERAPEUTIC_TYPES = gql`
  enum TreatmentStatus {
    ACTIVE
    COMPLETED
    SCHEDULED
  }

  enum TreatmentPriority {
    HIGH
    MEDIUM
    LOW
  }

  type Medication {
    id: ID!
    name: String!
    dosage: String!
    frequency: String!
    duration: Int!
    startDate: String!
    endDate: String!
    notes: String
  }

  type Treatment {
    id: ID!
    animalId: ID!
    animalName: String!
    condition: String!
    treatment: String!
    startDate: String!
    endDate: String!
    status: TreatmentStatus!
    priority: TreatmentPriority!
    notes: String
    nextCheckup: String
    prescribedBy: String!
    medications: [Medication!]!
    createdAt: String!
    updatedAt: String!
  }

  type TreatmentStats {
    totalActive: Int!
    totalScheduled: Int!
    totalCompleted: Int!
    upcomingCheckups: Int!
    criticalTreatments: Int!
  }

  type TherapeuticOverview {
    treatments: [Treatment!]!
    stats: TreatmentStats!
  }

  input MedicationInput {
    name: String!
    dosage: String!
    frequency: String!
    duration: Int!
    notes: String
  }

  input AddTreatmentInput {
    animalId: ID!
    condition: String!
    treatment: String!
    startDate: String!
    endDate: String!
    priority: TreatmentPriority!
    notes: String
    nextCheckup: String
    prescribedBy: String!
    medications: [MedicationInput!]!
  }

  input UpdateTreatmentInput {
    id: ID!
    condition: String
    treatment: String
    startDate: String
    endDate: String
    status: TreatmentStatus
    priority: TreatmentPriority
    notes: String
    nextCheckup: String
    prescribedBy: String
    medications: [MedicationInput!]
  }

  type Query {
    therapeuticOverview: TherapeuticOverview!
    treatment(id: ID!): Treatment
    animalTreatmentHistory(animalId: ID!): [Treatment!]!
  }

  type Mutation {
    addTreatment(input: AddTreatmentInput!): Treatment!
    updateTreatment(input: UpdateTreatmentInput!): Treatment!
    deleteTreatment(id: ID!): Boolean!
    completeTreatment(id: ID!): Treatment!
    updateMedication(treatmentId: ID!, medicationId: ID!, input: MedicationInput!): Medication!
    deleteMedication(treatmentId: ID!, medicationId: ID!): Boolean!
  }
`;
