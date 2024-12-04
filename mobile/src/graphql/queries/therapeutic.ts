import { gql } from '@apollo/client';

export const GET_THERAPEUTIC_OVERVIEW = gql`
  query GetTherapeuticOverview {
    therapeuticOverview {
      treatments {
        id
        animalId
        animalName
        condition
        treatment
        startDate
        endDate
        status
        priority
        notes
        nextCheckup
        prescribedBy
        medications {
          id
          name
          dosage
          frequency
          duration
          startDate
          endDate
          notes
        }
        createdAt
        updatedAt
      }
      stats {
        totalActive
        totalScheduled
        totalCompleted
        upcomingCheckups
        criticalTreatments
      }
    }
  }
`;

export const GET_TREATMENT = gql`
  query GetTreatment($id: ID!) {
    treatment(id: $id) {
      id
      animalId
      animalName
      condition
      treatment
      startDate
      endDate
      status
      priority
      notes
      nextCheckup
      prescribedBy
      medications {
        id
        name
        dosage
        frequency
        duration
        startDate
        endDate
        notes
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_ANIMAL_TREATMENT_HISTORY = gql`
  query GetAnimalTreatmentHistory($animalId: ID!) {
    animalTreatmentHistory(animalId: $animalId) {
      id
      condition
      treatment
      startDate
      endDate
      status
      priority
      prescribedBy
      medications {
        name
        dosage
      }
    }
  }
`;

export const ADD_TREATMENT = gql`
  mutation AddTreatment($input: AddTreatmentInput!) {
    addTreatment(input: $input) {
      id
      animalId
      animalName
      condition
      treatment
      startDate
      endDate
      status
      priority
      notes
      nextCheckup
      prescribedBy
      medications {
        id
        name
        dosage
        frequency
        duration
        startDate
        endDate
        notes
      }
    }
  }
`;

export const UPDATE_TREATMENT = gql`
  mutation UpdateTreatment($input: UpdateTreatmentInput!) {
    updateTreatment(input: $input) {
      id
      condition
      treatment
      startDate
      endDate
      status
      priority
      notes
      nextCheckup
      prescribedBy
      medications {
        id
        name
        dosage
        frequency
        duration
        startDate
        endDate
        notes
      }
    }
  }
`;

export const COMPLETE_TREATMENT = gql`
  mutation CompleteTreatment($id: ID!) {
    completeTreatment(id: $id) {
      id
      status
      endDate
    }
  }
`;

export const DELETE_TREATMENT = gql`
  mutation DeleteTreatment($id: ID!) {
    deleteTreatment(id: $id)
  }
`;

export const UPDATE_MEDICATION = gql`
  mutation UpdateMedication(
    $treatmentId: ID!
    $medicationId: ID!
    $input: MedicationInput!
  ) {
    updateMedication(
      treatmentId: $treatmentId
      medicationId: $medicationId
      input: $input
    ) {
      id
      name
      dosage
      frequency
      duration
      startDate
      endDate
      notes
    }
  }
`;

export const DELETE_MEDICATION = gql`
  mutation DeleteMedication($treatmentId: ID!, $medicationId: ID!) {
    deleteMedication(treatmentId: $treatmentId, medicationId: $medicationId)
  }
`;
