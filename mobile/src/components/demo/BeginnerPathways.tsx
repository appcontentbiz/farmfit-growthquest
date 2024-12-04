import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated
} from 'react-native';
import { Card, Title, Paragraph, Button, Text, ProgressBar, IconButton } from 'react-native-paper';
import { Video } from 'expo-av';
import { LineChart, BarChart } from 'react-native-chart-kit';

interface LearningPath {
  id: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Easy Start' | 'Gradual' | 'Comfortable Pace';
  spaceNeeded: string;
  timeCommitment: string;
  initialCost: string;
  sustainabilityCost: string;
  quickWins: string[];
  learningSteps: {
    title: string;
    duration: string;
    tasks: string[];
    resources: string[];
    quiz: any[];
  }[];
  visualGuides: string[];
  interactiveElements: string[];
  communitySupport: string[];
  nextSteps: string[];
}

const additionalBeginnerPaths: LearningPath[] = [
  {
    id: 'windowfarm',
    name: 'Window Farm System',
    description: 'Create a vertical hydroponic garden right in your window!',
    difficulty: 'Beginner',
    spaceNeeded: 'Window Space',
    timeCommitment: '15-20 mins/day',
    initialCost: '$50-100',
    sustainabilityCost: '$10/month',
    quickWins: [
      'First sprouts in 3-5 days',
      'Lettuce ready in 30 days',
      'Year-round growing',
      'Perfect for apartments'
    ],
    learningSteps: [
      {
        title: 'Setup Your Window Farm',
        duration: '2-3 hours',
        tasks: [
          'Choose your window space',
          'Gather basic materials',
          'Set up water system',
          'Plant first seeds'
        ],
        resources: [
          'Window assessment guide',
          'Material shopping list',
          'Setup video tutorial',
          'First planting guide'
        ],
        quiz: []
      }
    ],
    visualGuides: [],
    interactiveElements: [],
    communitySupport: [],
    nextSteps: []
  },
  {
    id: 'smartplanter',
    name: 'Smart Self-Watering Planter',
    description: 'Perfect for busy beginners - let technology help you grow!',
    difficulty: 'Easy Start',
    spaceNeeded: 'Countertop',
    timeCommitment: '10 mins/week',
    initialCost: '$75-150',
    sustainabilityCost: '$5/month',
    quickWins: [
      'No daily watering needed',
      'Plant monitoring app',
      'Guaranteed growth',
      'Works while you travel'
    ],
    learningSteps: [],
    visualGuides: [],
    interactiveElements: [],
    communitySupport: [],
    nextSteps: []
  },
  {
    id: 'butterflygarden',
    name: 'Butterfly & Bee Garden',
    description: 'Create a beautiful, eco-friendly garden that attracts pollinators',
    difficulty: 'Gradual',
    spaceNeeded: 'Small Outdoor Space',
    timeCommitment: '2-3 hours/week',
    initialCost: '$100-200',
    sustainabilityCost: '$20/month',
    quickWins: [
      'First butterflies in weeks',
      'Continuous blooming',
      'Help local ecosystem',
      'Beautiful garden space'
    ],
    learningSteps: [],
    visualGuides: [],
    interactiveElements: [],
    communitySupport: [],
    nextSteps: []
  },
  {
    id: 'aquaponics',
    name: 'Mini Aquaponics System',
    description: 'Combine fish keeping with plant growing in a sustainable system',
    difficulty: 'Comfortable Pace',
    spaceNeeded: 'Table/Counter Space',
    timeCommitment: '20 mins/day',
    initialCost: '$150-300',
    sustainabilityCost: '$25/month',
    quickWins: [
      'Fish add immediate life',
      'Plants grow faster',
      'Self-sustaining system',
      'Educational for kids'
    ],
    learningSteps: [],
    visualGuides: [],
    interactiveElements: [],
    communitySupport: [],
    nextSteps: []
  },
  {
    id: 'mushroomkit',
    name: 'Indoor Mushroom Growing',
    description: 'Grow gourmet mushrooms in any dark space',
    difficulty: 'Easy Start',
    spaceNeeded: 'Dark Cabinet Space',
    timeCommitment: '5 mins/day',
    initialCost: '$30-75',
    sustainabilityCost: '$15/month',
    quickWins: [
      'First harvest in 4-6 weeks',
      'Multiple harvests possible',
      'Year-round growing',
      'Unique hobby'
    ],
    learningSteps: [],
    visualGuides: [],
    interactiveElements: [],
    communitySupport: [],
    nextSteps: []
  }
];

const interactiveModules = [
  {
    id: 'virtual-garden',
    name: 'Virtual Garden Simulator',
    description: 'Practice plant care in a risk-free environment',
    features: [
      'Plant growth simulation',
      'Weather impact scenarios',
      'Pest management practice',
      'Resource management'
    ]
  },
  {
    id: 'plant-diagnosis',
    name: 'Plant Health Checker',
    description: 'Learn to identify and solve common plant problems',
    features: [
      'Visual problem identifier',
      'Treatment recommendations',
      'Prevention tips',
      'Expert consultation'
    ]
  },
  {
    id: 'season-planner',
    name: 'Seasonal Planning Tool',
    description: 'Plan your garden through all seasons',
    features: [
      'Crop calendar',
      'Weather integration',
      'Planting reminders',
      'Harvest forecasting'
    ]
  }
];

const visualTutorials = [
  {
    id: 'basics-101',
    name: 'Farming Basics 101',
    modules: [
      {
        title: 'Understanding Soil',
        duration: '10 mins',
        type: 'video'
      },
      {
        title: 'Water & Nutrients',
        duration: '15 mins',
        type: 'interactive'
      },
      {
        title: 'Light Requirements',
        duration: '12 mins',
        type: 'video'
      }
    ]
  },
  {
    id: 'troubleshooting',
    name: 'Common Problems & Solutions',
    modules: [
      {
        title: 'Plant Health Issues',
        duration: '20 mins',
        type: 'interactive'
      },
      {
        title: 'Pest Management',
        duration: '15 mins',
        type: 'video'
      },
      {
        title: 'Disease Prevention',
        duration: '18 mins',
        type: 'interactive'
      }
    ]
  }
];

const BeginnerPathways: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [progress, setProgress] = useState({});
  const [activeModule, setActiveModule] = useState(null);

  const renderPathCard = (path: LearningPath) => (
    <TouchableOpacity
      key={path.id}
      onPress={() => setSelectedPath(path)}
    >
      <Card style={styles.pathCard}>
        <Card.Content>
          <Title>{path.name}</Title>
          <Paragraph>{path.description}</Paragraph>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Difficulty</Text>
              <Text style={styles.statValue}>{path.difficulty}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Space</Text>
              <Text style={styles.statValue}>{path.spaceNeeded}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Time</Text>
              <Text style={styles.statValue}>{path.timeCommitment}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Initial Cost</Text>
              <Text style={styles.statValue}>{path.initialCost}</Text>
            </View>
          </View>
          <View style={styles.quickWinsContainer}>
            <Title style={styles.quickWinsTitle}>Quick Wins</Title>
            {path.quickWins.map((win, index) => (
              <Text key={index} style={styles.quickWinItem}>✓ {win}</Text>
            ))}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderInteractiveModules = () => (
    <View style={styles.modulesContainer}>
      <Title style={styles.sectionTitle}>Interactive Learning</Title>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {interactiveModules.map(module => (
          <Card key={module.id} style={styles.moduleCard}>
            <Card.Content>
              <Title>{module.name}</Title>
              <Paragraph>{module.description}</Paragraph>
              {module.features.map((feature, index) => (
                <Text key={index} style={styles.featureItem}>• {feature}</Text>
              ))}
              <Button
                mode="contained"
                onPress={() => setActiveModule(module)}
                style={styles.moduleButton}
              >
                Start Learning
              </Button>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );

  const renderVisualTutorials = () => (
    <View style={styles.tutorialsContainer}>
      <Title style={styles.sectionTitle}>Visual Guides</Title>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {visualTutorials.map(tutorial => (
          <Card key={tutorial.id} style={styles.tutorialCard}>
            <Card.Content>
              <Title>{tutorial.name}</Title>
              {tutorial.modules.map((module, index) => (
                <View key={index} style={styles.moduleItem}>
                  <Text style={styles.moduleTitle}>{module.title}</Text>
                  <Text style={styles.moduleDuration}>{module.duration}</Text>
                  <IconButton
                    icon={module.type === 'video' ? 'play' : 'school'}
                    size={24}
                    onPress={() => {/* Handle module start */}}
                  />
                </View>
              ))}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.mainTitle}>Choose Your Starting Path</Title>
      <Paragraph style={styles.subtitle}>
        Select from these beginner-friendly projects designed for success!
      </Paragraph>
      
      {additionalBeginnerPaths.map(renderPathCard)}
      {renderInteractiveModules()}
      {renderVisualTutorials()}
      
      {selectedPath && (
        <View style={styles.detailSection}>
          {/* Detailed path content */}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  pathCard: {
    marginBottom: 15,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
  },
  statItem: {
    width: '50%',
    padding: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickWinsContainer: {
    marginTop: 15,
  },
  quickWinsTitle: {
    fontSize: 16,
    marginBottom: 5,
  },
  quickWinItem: {
    marginVertical: 2,
  },
  modulesContainer: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 15,
  },
  moduleCard: {
    width: 300,
    marginRight: 15,
  },
  featureItem: {
    marginVertical: 3,
  },
  moduleButton: {
    marginTop: 10,
  },
  tutorialsContainer: {
    marginVertical: 20,
  },
  tutorialCard: {
    width: 280,
    marginRight: 15,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  moduleTitle: {
    flex: 1,
  },
  moduleDuration: {
    color: '#666',
    marginRight: 10,
  },
  detailSection: {
    marginTop: 20,
  },
});

export default BeginnerPathways;
