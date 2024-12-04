import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  Chip,
  Avatar,
  ProgressBar
} from 'react-native-paper';

// Region-Specific Projects
const regionalProjects = {
  northEast: [
    {
      id: 'ne_indoor_winter',
      name: 'Four-Season Indoor Farm',
      description: 'Year-round growing despite harsh winters',
      difficulty: 'Beginner',
      space: 'Spare Room',
      climate: 'Cold Winter',
      investment: '$200-400',
      features: [
        'LED growing systems',
        'Temperature control',
        'Winter crops selection',
        'Energy efficiency tips'
      ]
    },
    {
      id: 'ne_maple_micro',
      name: 'Maple Syrup Micro-Operation',
      description: 'Small-scale maple syrup production',
      difficulty: 'Moderate',
      space: 'Few Trees',
      climate: 'Cold Winter',
      investment: '$150-300',
      features: [
        'Tree identification',
        'Tapping basics',
        'Processing equipment',
        'Storage solutions'
      ]
    }
  ],
  southEast: [
    {
      id: 'se_humidity_garden',
      name: 'Humidity-Smart Garden',
      description: 'Growing in high humidity conditions',
      difficulty: 'Beginner',
      space: 'Patio/Small Yard',
      climate: 'Humid Subtropical',
      investment: '$100-250',
      features: [
        'Humidity management',
        'Pest prevention',
        'Heat-resistant varieties',
        'Natural ventilation'
      ]
    },
    {
      id: 'se_citrus_starter',
      name: 'Citrus Container Garden',
      description: 'Small-scale citrus growing',
      difficulty: 'Easy',
      space: 'Patio',
      climate: 'Warm',
      investment: '$150-300',
      features: [
        'Dwarf varieties',
        'Container selection',
        'Pest management',
        'Fertilization schedule'
      ]
    }
  ],
  midWest: [
    {
      id: 'mw_wind_garden',
      name: 'Wind-Protected Garden',
      description: 'Growing in windy conditions',
      difficulty: 'Beginner',
      space: 'Backyard',
      climate: 'Variable',
      investment: '$150-300',
      features: [
        'Windbreak design',
        'Plant selection',
        'Support structures',
        'Soil retention'
      ]
    }
  ],
  southWest: [
    {
      id: 'sw_desert_oasis',
      name: 'Desert Micro-Oasis',
      description: 'Thriving garden in arid conditions',
      difficulty: 'Moderate',
      space: 'Small Yard',
      climate: 'Arid',
      investment: '$200-400',
      features: [
        'Water conservation',
        'Shade management',
        'Desert-adapted plants',
        'Soil enhancement'
      ]
    }
  ],
  westCoast: [
    {
      id: 'wc_fog_garden',
      name: 'Fog-Belt Garden',
      description: 'Utilizing natural fog for growing',
      difficulty: 'Easy',
      space: 'Small Yard',
      climate: 'Mediterranean',
      investment: '$100-250',
      features: [
        'Fog collection',
        'Humidity lovers',
        'Light management',
        'Disease prevention'
      ]
    }
  ]
};

// Enhanced AR/VR Experiences
const immersiveTools = [
  {
    id: 'ar_garden_planner',
    name: 'AR Garden Designer Pro',
    description: 'Advanced garden planning in augmented reality',
    features: [
      'Real-time sun tracking',
      'Plant spacing visualization',
      'Growth simulation',
      'Season changes preview'
    ]
  },
  {
    id: 'vr_master_class',
    name: 'VR Master Classes',
    description: 'Learn from experts in virtual reality',
    features: [
      'Interactive lessons',
      'Virtual field trips',
      'Hands-on practice',
      'Expert feedback'
    ]
  },
  {
    id: 'mixed_reality_diagnostic',
    name: 'Mixed Reality Plant Doctor',
    description: 'Advanced plant health diagnostics',
    features: [
      'Real-time analysis',
      'Treatment visualization',
      'Progress tracking',
      'Expert consultation'
    ]
  }
];

// Specialized Interest Projects
const specializedProjects = [
  {
    id: 'medicinal_herbs',
    name: 'Medicinal Herb Garden',
    description: 'Grow your own healing herbs',
    difficulty: 'Moderate',
    focus: 'Health & Wellness',
    features: [
      'Herb selection guide',
      'Processing methods',
      'Storage solutions',
      'Usage guidelines'
    ]
  },
  {
    id: 'butterfly_sanctuary',
    name: 'Butterfly Sanctuary',
    description: 'Create a haven for butterflies',
    difficulty: 'Easy',
    focus: 'Wildlife & Conservation',
    features: [
      'Plant selection',
      'Habitat design',
      'Butterfly identification',
      'Conservation tips'
    ]
  },
  {
    id: 'gourmet_mushrooms',
    name: 'Gourmet Mushroom Lab',
    description: 'Indoor mushroom cultivation',
    difficulty: 'Moderate',
    focus: 'Specialty Food',
    features: [
      'Setup guide',
      'Species selection',
      'Growing conditions',
      'Harvesting tips'
    ]
  }
];

// Interactive Success Metrics
const successMetrics = {
  growthTracking: {
    categories: [
      'Plant Health',
      'Yield Quantity',
      'Resource Efficiency',
      'Learning Progress'
    ],
    measurements: [
      'Growth rate',
      'Harvest weight',
      'Water usage',
      'Skills mastered'
    ]
  },
  achievements: {
    levels: [
      'Seed Starter',
      'Green Thumb',
      'Garden Guru',
      'Master Grower'
    ],
    badges: [
      'First Harvest',
      'Pest Manager',
      'Water Wise',
      'Soil Scientist'
    ]
  }
};

const RegionalSpecialistHub: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [userProgress, setUserProgress] = useState({});
  const [userMetrics, setUserMetrics] = useState({});

  const renderRegionalProject = (project) => (
    <Card key={project.id} style={styles.projectCard}>
      <Card.Content>
        <Title>{project.name}</Title>
        <Paragraph>{project.description}</Paragraph>
        <View style={styles.chipContainer}>
          <Chip icon="thermometer">{project.climate}</Chip>
          <Chip icon="ruler">{project.space}</Chip>
          <Chip icon="currency-usd">{project.investment}</Chip>
        </View>
        <View style={styles.featuresList}>
          {project.features.map((feature, index) => (
            <Text key={index} style={styles.featureItem}>• {feature}</Text>
          ))}
        </View>
        <Button mode="contained" onPress={() => setSelectedProject(project)}>
          Start Project
        </Button>
      </Card.Content>
    </Card>
  );

  const renderImmersiveTool = (tool) => (
    <Card key={tool.id} style={styles.toolCard}>
      <Card.Content>
        <Title>{tool.name}</Title>
        <Paragraph>{tool.description}</Paragraph>
        <View style={styles.featuresList}>
          {tool.features.map((feature, index) => (
            <Text key={index} style={styles.featureItem}>✓ {feature}</Text>
          ))}
        </View>
        <Button mode="outlined" onPress={() => {}}>
          Launch Experience
        </Button>
      </Card.Content>
    </Card>
  );

  const renderSpecializedProject = (project) => (
    <Card key={project.id} style={styles.specializedCard}>
      <Card.Content>
        <Title>{project.name}</Title>
        <Paragraph>{project.description}</Paragraph>
        <Chip style={styles.focusChip}>{project.focus}</Chip>
        <View style={styles.featuresList}>
          {project.features.map((feature, index) => (
            <Text key={index} style={styles.featureItem}>• {feature}</Text>
          ))}
        </View>
        <Button mode="contained" onPress={() => {}}>
          Explore Project
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.sectionTitle}>Regional Growing Guides</Title>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {Object.entries(regionalProjects).map(([region, projects]) => (
          <View key={region} style={styles.regionContainer}>
            <Title style={styles.regionTitle}>
              {region.replace(/([A-Z])/g, ' $1').trim()}
            </Title>
            {projects.map(renderRegionalProject)}
          </View>
        ))}
      </ScrollView>

      <Title style={styles.sectionTitle}>Immersive Learning</Title>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {immersiveTools.map(renderImmersiveTool)}
      </ScrollView>

      <Title style={styles.sectionTitle}>Specialized Projects</Title>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {specializedProjects.map(renderSpecializedProject)}
      </ScrollView>

      <Title style={styles.sectionTitle}>Track Your Progress</Title>
      <Card style={styles.metricsCard}>
        <Card.Content>
          <Title>Growth Metrics</Title>
          {successMetrics.growthTracking.categories.map((category, index) => (
            <View key={index} style={styles.metricContainer}>
              <Text>{category}</Text>
              <ProgressBar
                progress={Math.random()}
                style={styles.progressBar}
              />
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.achievementsCard}>
        <Card.Content>
          <Title>Achievements</Title>
          <View style={styles.badgeContainer}>
            {successMetrics.achievements.badges.map((badge, index) => (
              <View key={index} style={styles.badge}>
                <Avatar.Icon size={40} icon="star" />
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
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
  regionContainer: {
    marginRight: 20,
  },
  regionTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  projectCard: {
    width: 300,
    marginBottom: 15,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginVertical: 10,
  },
  featuresList: {
    marginVertical: 10,
  },
  featureItem: {
    marginVertical: 2,
  },
  toolCard: {
    width: 280,
    marginRight: 15,
  },
  specializedCard: {
    width: 300,
    marginRight: 15,
  },
  focusChip: {
    marginVertical: 10,
  },
  metricsCard: {
    marginVertical: 10,
  },
  metricContainer: {
    marginVertical: 5,
  },
  progressBar: {
    marginTop: 5,
  },
  achievementsCard: {
    marginVertical: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 10,
  },
  badge: {
    alignItems: 'center',
  },
  badgeText: {
    marginTop: 5,
    textAlign: 'center',
  },
});

export default RegionalSpecialistHub;
