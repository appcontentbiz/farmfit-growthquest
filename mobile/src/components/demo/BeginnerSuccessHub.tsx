import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  ProgressBar,
  IconButton,
  Avatar,
  Badge,
  Chip
} from 'react-native-paper';
import { Video } from 'expo-av';
import { LineChart, BarChart } from 'react-native-chart-kit';

// Additional Specialized Beginner Projects
const specializedProjects = [
  {
    id: 'vertical_garden',
    name: 'Vertical Salad Wall',
    description: 'Create a living wall of fresh salad greens',
    difficulty: 'Beginner',
    space: 'Wall Space',
    time: '15 mins/day',
    cost: '$100-150',
    quickWins: [
      'First harvest in 3 weeks',
      'Beautiful living decor',
      'Fresh salads daily',
      'Space-efficient design'
    ]
  },
  {
    id: 'kitchen_sprouts',
    name: 'Kitchen Sprout Station',
    description: 'Grow nutritious sprouts in your kitchen',
    difficulty: 'Very Easy',
    space: 'Counter Space',
    time: '5 mins/day',
    cost: '$25-50',
    quickWins: [
      'Harvest in 5-7 days',
      'Super nutritious',
      'No soil needed',
      'Year-round growing'
    ]
  },
  {
    id: 'tea_garden',
    name: 'Indoor Tea Garden',
    description: 'Grow and blend your own herbal teas',
    difficulty: 'Easy',
    space: 'Windowsill',
    time: '10 mins/day',
    cost: '$50-75',
    quickWins: [
      'Fresh tea in weeks',
      'Aromatic home',
      'Medicinal benefits',
      'Creative blending'
    ]
  },
  {
    id: 'mini_orchard',
    name: 'Dwarf Fruit Tree Collection',
    description: 'Grow mini fruit trees in containers',
    difficulty: 'Moderate',
    space: 'Patio/Balcony',
    time: '20 mins/day',
    cost: '$150-200',
    quickWins: [
      'Beautiful blossoms',
      'Fresh fruits',
      'Portable trees',
      'Long-term rewards'
    ]
  },
  {
    id: 'microgreens_business',
    name: 'Microgreens Market Garden',
    description: 'Start a small microgreens business',
    difficulty: 'Easy-Moderate',
    space: 'Shelf Space',
    time: '30 mins/day',
    cost: '$200-300',
    quickWins: [
      'First sales in 2 weeks',
      'High-value crop',
      'Regular income',
      'Scalable system'
    ]
  }
];

// Enhanced Virtual Learning Tools
const virtualTools = [
  {
    id: 'ar_garden_planner',
    name: 'AR Garden Designer',
    description: 'Design your garden in augmented reality',
    features: [
      'Space visualization',
      'Plant compatibility checker',
      'Sunlight analyzer',
      'Growth simulation'
    ]
  },
  {
    id: 'plant_ai_mentor',
    name: 'AI Plant Mentor',
    description: 'Personal AI assistant for plant care',
    features: [
      'Daily care reminders',
      'Problem diagnosis',
      'Growth tracking',
      'Care recommendations'
    ]
  },
  {
    id: 'virtual_greenhouse',
    name: 'Virtual Greenhouse',
    description: 'Practice growing in a virtual environment',
    features: [
      'Climate control practice',
      'Pest management scenarios',
      'Resource optimization',
      'Yield prediction'
    ]
  }
];

// Expanded Community Features
const communityFeatures = [
  {
    id: 'mentor_matching',
    name: 'Mentor Match',
    description: 'Connect with experienced farmers',
    features: [
      'Personalized matching',
      'Weekly check-ins',
      'Knowledge sharing',
      'Success tracking'
    ]
  },
  {
    id: 'success_stories',
    name: 'Success Showcase',
    description: 'Share and celebrate achievements',
    features: [
      'Progress photos',
      'Milestone sharing',
      'Community feedback',
      'Achievement badges'
    ]
  },
  {
    id: 'local_groups',
    name: 'Local Growing Groups',
    description: 'Connect with nearby farmers',
    features: [
      'Local meetups',
      'Resource sharing',
      'Seasonal planning',
      'Group projects'
    ]
  },
  {
    id: 'marketplace',
    name: 'Growers Marketplace',
    description: 'Buy, sell, and trade with community',
    features: [
      'Equipment exchange',
      'Seed sharing',
      'Produce sales',
      'Group buying'
    ]
  }
];

// Success Tracking Tools
const successTracking = [
  {
    id: 'growth_journal',
    name: 'Digital Growth Journal',
    features: [
      'Photo timeline',
      'Growth metrics',
      'Weather correlation',
      'Yield tracking'
    ]
  },
  {
    id: 'achievement_system',
    name: 'Achievement System',
    features: [
      'Skill badges',
      'Learning paths',
      'Challenge completion',
      'Community recognition'
    ]
  },
  {
    id: 'roi_calculator',
    name: 'ROI Calculator',
    features: [
      'Cost tracking',
      'Yield value',
      'Resource efficiency',
      'Profit analysis'
    ]
  }
];

// Knowledge Base
const knowledgeBase = [
  {
    id: 'quick_guides',
    name: 'Quick Start Guides',
    categories: [
      'Plant Selection',
      'Basic Care',
      'Problem Solving',
      'Seasonal Tips'
    ]
  },
  {
    id: 'video_library',
    name: 'Video Library',
    categories: [
      'Setup Tutorials',
      'Care Instructions',
      'Troubleshooting',
      'Success Stories'
    ]
  },
  {
    id: 'expert_talks',
    name: 'Expert Talks',
    categories: [
      'Growing Tips',
      'Market Insights',
      'Sustainable Practices',
      'Innovation Updates'
    ]
  }
];

const BeginnerSuccessHub: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [learningProgress, setLearningProgress] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [communityStats, setCommunityStats] = useState({
    mentorSessions: 0,
    projectsShared: 0,
    questionsAnswered: 0,
    connectionsMade: 0
  });

  const renderProjectCard = (project) => (
    <TouchableOpacity
      key={project.id}
      onPress={() => setSelectedProject(project)}
    >
      <Card style={styles.projectCard}>
        <Card.Content>
          <Title>{project.name}</Title>
          <Paragraph>{project.description}</Paragraph>
          <View style={styles.projectStats}>
            <Chip icon="clock">{project.time}</Chip>
            <Chip icon="ruler">{project.space}</Chip>
            <Chip icon="currency-usd">{project.cost}</Chip>
          </View>
          <View style={styles.quickWins}>
            {project.quickWins.map((win, index) => (
              <Text key={index} style={styles.quickWin}>✓ {win}</Text>
            ))}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderVirtualTool = (tool) => (
    <Card key={tool.id} style={styles.toolCard}>
      <Card.Content>
        <Title>{tool.name}</Title>
        <Paragraph>{tool.description}</Paragraph>
        <View style={styles.featureList}>
          {tool.features.map((feature, index) => (
            <Chip key={index} style={styles.featureChip}>{feature}</Chip>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  const renderCommunityFeature = (feature) => (
    <Card key={feature.id} style={styles.communityCard}>
      <Card.Content>
        <Title>{feature.name}</Title>
        <Paragraph>{feature.description}</Paragraph>
        <View style={styles.featureGrid}>
          {feature.features.map((item, index) => (
            <View key={index} style={styles.featureItem}>
              <IconButton icon="check-circle" size={24} />
              <Text>{item}</Text>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  const renderSuccessTracker = (tracker) => (
    <Card key={tracker.id} style={styles.trackerCard}>
      <Card.Content>
        <Title>{tracker.name}</Title>
        <View style={styles.trackerFeatures}>
          {tracker.features.map((feature, index) => (
            <View key={index} style={styles.trackerFeature}>
              <IconButton icon="star" size={20} />
              <Text>{feature}</Text>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.sectionTitle}>Specialized Projects</Title>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {specializedProjects.map(renderProjectCard)}
      </ScrollView>

      <Title style={styles.sectionTitle}>Virtual Learning Tools</Title>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {virtualTools.map(renderVirtualTool)}
      </ScrollView>

      <Title style={styles.sectionTitle}>Community Features</Title>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {communityFeatures.map(renderCommunityFeature)}
      </ScrollView>

      <Title style={styles.sectionTitle}>Track Your Success</Title>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {successTracking.map(renderSuccessTracker)}
      </ScrollView>

      <Title style={styles.sectionTitle}>Knowledge Base</Title>
      <View style={styles.knowledgeGrid}>
        {knowledgeBase.map((section) => (
          <Card key={section.id} style={styles.knowledgeCard}>
            <Card.Content>
              <Title>{section.name}</Title>
              {section.categories.map((category, index) => (
                <TouchableOpacity key={index} style={styles.categoryItem}>
                  <Text>{category}</Text>
                  <IconButton icon="chevron-right" size={20} />
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 15,
  },
  projectCard: {
    width: 300,
    marginRight: 15,
    marginBottom: 10,
  },
  projectStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 10,
  },
  quickWins: {
    marginTop: 10,
  },
  quickWin: {
    marginVertical: 2,
  },
  toolCard: {
    width: 280,
    marginRight: 15,
  },
  featureList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 10,
  },
  featureChip: {
    marginVertical: 2,
  },
  communityCard: {
    width: 300,
    marginRight: 15,
  },
  featureGrid: {
    marginTop: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  trackerCard: {
    width: 250,
    marginRight: 15,
  },
  trackerFeatures: {
    marginTop: 10,
  },
  trackerFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  knowledgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 10,
  },
  knowledgeCard: {
    flex: 1,
    minWidth: 250,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default BeginnerSuccessHub;
