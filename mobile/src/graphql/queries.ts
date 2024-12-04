import { gql } from '@apollo/client';

export const GET_LIVESTOCK_OVERVIEW = gql`
  query GetLivestockOverview {
    livestockOverview {
      livestock {
        id
        name
        breed
        age
        weight
        healthStatus
        lastCheckup
        tags
        notes
      }
      healthMetrics {
        date
        score
        temperature
        heartRate
        respirationRate
        feedIntake
        waterIntake
      }
      alerts {
        id
        severity
        message
        timestamp
        status
      }
    }
  }
`;

export const UPDATE_HEALTH_CHECK = gql`
  mutation UpdateHealthCheck($livestockId: ID!, $timestamp: String!) {
    updateHealthCheck(livestockId: $livestockId, timestamp: $timestamp) {
      id
      lastCheckup
      healthStatus
      healthMetrics {
        date
        score
        temperature
        heartRate
        respirationRate
      }
    }
  }
`;

export const GET_LIVESTOCK_DETAIL = gql`
  query GetLivestockDetail($id: ID!) {
    livestock(id: $id) {
      id
      name
      breed
      species
      age
      weight
      healthStatus
      lastCheckup
      birthDate
      purchaseDate
      purchasePrice
      tags
      notes
      location
      healthHistory {
        date
        type
        description
        performer
        medications
        notes
      }
      vaccinations {
        date
        type
        dueDate
        performer
        notes
      }
      nutritionPlan {
        feedType
        dailyAmount
        frequency
        supplements
        notes
      }
      metrics {
        date
        weight
        temperature
        heartRate
        respirationRate
        feedIntake
        waterIntake
      }
    }
  }
`;

export const ADD_LIVESTOCK = gql`
  mutation AddLivestock($input: LivestockInput!) {
    addLivestock(input: $input) {
      id
      name
      breed
      species
      age
      weight
      healthStatus
    }
  }
`;

export const UPDATE_LIVESTOCK = gql`
  mutation UpdateLivestock($id: ID!, $input: LivestockInput!) {
    updateLivestock(id: $id, input: $input) {
      id
      name
      breed
      species
      age
      weight
      healthStatus
    }
  }
`;

export const ADD_HEALTH_RECORD = gql`
  mutation AddHealthRecord($livestockId: ID!, $input: HealthRecordInput!) {
    addHealthRecord(livestockId: $livestockId, input: $input) {
      id
      date
      type
      description
      performer
      medications
      notes
    }
  }
`;

export const ADD_VACCINATION = gql`
  mutation AddVaccination($livestockId: ID!, $input: VaccinationInput!) {
    addVaccination(livestockId: $livestockId, input: $input) {
      id
      date
      type
      dueDate
      performer
      notes
    }
  }
`;

export const UPDATE_NUTRITION_PLAN = gql`
  mutation UpdateNutritionPlan($livestockId: ID!, $input: NutritionPlanInput!) {
    updateNutritionPlan(livestockId: $livestockId, input: $input) {
      feedType
      dailyAmount
      frequency
      supplements
      notes
    }
  }
`;

export const GET_HEALTH_ANALYTICS = gql`
  query GetHealthAnalytics($livestockId: ID!, $startDate: String!, $endDate: String!) {
    healthAnalytics(livestockId: $livestockId, startDate: $startDate, endDate: $endDate) {
      dailyMetrics {
        date
        weight
        temperature
        heartRate
        respirationRate
        feedIntake
        waterIntake
      }
      trends {
        metric
        trend
        change
        recommendation
      }
      predictions {
        metric
        value
        confidence
        factors
      }
      anomalies {
        date
        metric
        value
        severity
        description
      }
    }
  }
`;
