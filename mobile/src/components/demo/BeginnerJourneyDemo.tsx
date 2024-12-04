import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Card, Title, Paragraph, Button, Text, ProgressBar } from 'react-native-paper';
import { Video } from 'expo-av';

interface FarmingStyle {
  id: string;
  name: string;
  description: string;
  difficulty: 'Very Easy' | 'Easy' | 'Moderate';
  spaceNeeded: 'Windowsill' | 'Backyard' | 'Small Plot' | 'Large Plot';
  timeCommitment: 'Hours/Week' | 'Hours/Day';
  startupCost: '$' | '$$' | '$$$';
  quickWins: string[];
  firstSteps: string[];
  videoGuide: string;
}

const BeginnerJourneyDemo: React.FC = () => {
  const [selectedStyle, setSelectedStyle] = useState<FarmingStyle | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);

  const farmingStyles: FarmingStyle[] = [
    {
      id: 'herbs',
      name: 'Indoor Herb Garden',
      description: 'Start your farming journey with simple herbs on your windowsill. Perfect for beginners!',
      difficulty: 'Very Easy',
      spaceNeeded: 'Windowsill',
      timeCommitment: 'Hours/Week',
      startupCost: '$',
      quickWins: [
        'Basil grows in 3-4 weeks',
        'Fresh herbs for cooking',
        'Learn basic plant care',
        'No special equipment needed'
      ],
      firstSteps: [
        'Get 3 small pots with drainage',
        'Buy organic potting soil',
        'Choose 3 herb seeds (basil, mint, parsley)',
        'Place on sunny windowsill',
        'Water gently when soil feels dry'
      ],
      videoGuide: 'herb-garden-guide.mp4'
    },
    {
      id: 'microgreens',
      name: 'Microgreens Growing',
      description: 'Quick-growing, nutritious greens you can grow indoors. See results in days!',
      difficulty: 'Very Easy',
      spaceNeeded: 'Windowsill',
      timeCommitment: 'Hours/Week',
      startupCost: '$',
      quickWins: [
        'Harvest in 7-14 days',
        'Highly nutritious',
        'Multiple harvests possible',
        'Perfect for small spaces'
      ],
      firstSteps: [
        'Get shallow growing trays',
        'Buy microgreen seeds mix',
        'Prepare growing medium',
        'Maintain consistent moisture',
        'Harvest when first leaves appear'
      ],
      videoGuide: 'microgreens-guide.mp4'
    },
    {
      id: 'container',
      name: 'Container Vegetable Garden',
      description: 'Grow vegetables in pots on your patio or balcony. Perfect for small spaces!',
      difficulty: 'Easy',
      spaceNeeded: 'Backyard',
      timeCommitment: 'Hours/Week',
      startupCost: '$$',
      quickWins: [
        'Grow fresh tomatoes and peppers',
        'Control growing conditions',
        'Easy to maintain',
        'Mobile garden setup'
      ],
      firstSteps: [
        'Select large containers with drainage',
        'Choose easy vegetables (cherry tomatoes, lettuce)',
        'Set up simple watering system',
        'Place in sunny location',
        'Start with seedlings instead of seeds'
      ],
      videoGuide: 'container-garden-guide.mp4'
    },
    {
      id: 'chickens',
      name: 'Backyard Chickens',
      description: 'Start with 3-4 chickens for fresh eggs and learn basic animal care.',
      difficulty: 'Moderate',
      spaceNeeded: 'Backyard',
      timeCommitment: 'Hours/Day',
      startupCost: '$$',
      quickWins: [
        'Fresh eggs daily',
        'Natural pest control',
        'Rich fertilizer for garden',
        'Engaging pets'
      ],
      firstSteps: [
        'Check local regulations',
        'Build/buy simple coop',
        'Start with 3-4 friendly breeds',
        'Set up feeding station',
        'Create daily care routine'
      ],
      videoGuide: 'chicken-care-guide.mp4'
    }
  ];

  const personalityQuestions = [
    {
      question: 'How much time can you dedicate to your farming project?',
      options: [
        '15-30 minutes a day',
        '1-2 hours a day',
        'Several hours a day',
        'Full time'
      ]
    },
    {
      question: 'What space do you have available?',
      options: [
        'Just a windowsill',
        'Balcony or patio',
        'Small backyard',
        'Large plot of land'
      ]
    },
    {
      question: 'What interests you most about farming?',
      options: [
        'Growing my own food',
        'Working with animals',
        'Building a business',
        'Sustainable living'
      ]
    },
    {
      question: 'How much would you like to invest initially?',
      options: [
        'Under $100',
        '$100-$500',
        '$500-$2000',
        'Over $2000'
      ]
    },
    {
      question: 'What's your experience with plants or animals?',
      options: [
        'None at all',
        'Had house plants',
        'Had a small garden',
        'Some farming experience'
      ]
    }
  ];

  const renderPersonalityQuiz = () => (
    <Card style={styles.quizCard}>
      <Card.Content>
        <Title>Find Your Farming Style</Title>
        <Paragraph>Let's discover the perfect starting point for you!</Paragraph>
        {personalityQuestions.map((q, index) => (
          <View key={index} style={styles.questionContainer}>
            <Text style={styles.question}>{q.question}</Text>
            {q.options.map((option, optIndex) => (
              <TouchableOpacity
                key={optIndex}
                style={styles.optionButton}
                onPress={() => handleQuizAnswer(index, optIndex)}
              >
                <Text>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  const renderBeginnerGuide = () => (
    <View style={styles.guideContainer}>
      <Title style={styles.guideTitle}>Welcome to Your Farming Journey!</Title>
      <Paragraph style={styles.guideParagraph}>
        Never grown anything before? Don't worry! We'll help you discover the
        perfect starting point and guide you every step of the way.
      </Paragraph>

      <Button
        mode="contained"
        style={styles.quizButton}
        onPress={() => setShowQuiz(true)}
      >
        Take the Farming Style Quiz
      </Button>

      <Title style={styles.sectionTitle}>Perfect Starting Projects</Title>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {farmingStyles.map((style) => (
          <TouchableOpacity
            key={style.id}
            onPress={() => setSelectedStyle(style)}
          >
            <Card style={styles.styleCard}>
              <Card.Content>
                <Title>{style.name}</Title>
                <Paragraph>{style.description}</Paragraph>
                <View style={styles.statsContainer}>
                  <Text style={styles.stat}>Difficulty: {style.difficulty}</Text>
                  <Text style={styles.stat}>Space: {style.spaceNeeded}</Text>
                  <Text style={styles.stat}>Time: {style.timeCommitment}</Text>
                  <Text style={styles.stat}>Cost: {style.startupCost}</Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedStyle && (
        <Card style={styles.detailCard}>
          <Card.Content>
            <Title>{selectedStyle.name} - Getting Started</Title>
            
            <Title style={styles.subsectionTitle}>Quick Wins</Title>
            {selectedStyle.quickWins.map((win, index) => (
              <Text key={index} style={styles.listItem}>✓ {win}</Text>
            ))}

            <Title style={styles.subsectionTitle}>First Steps</Title>
            {selectedStyle.firstSteps.map((step, index) => (
              <View key={index} style={styles.stepContainer}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
                <Text style={styles.stepText}>{step}</Text>
                <Button
                  mode="text"
                  onPress={() => markStepComplete(step)}
                  style={styles.stepButton}
                >
                  {completedSteps.includes(step) ? '✓ Done' : 'Mark Done'}
                </Button>
              </View>
            ))}

            <Title style={styles.subsectionTitle}>Your Progress</Title>
            <ProgressBar
              progress={
                completedSteps.filter((step) =>
                  selectedStyle.firstSteps.includes(step)
                ).length / selectedStyle.firstSteps.length
              }
              style={styles.progressBar}
            />

            <Button
              mode="contained"
              style={styles.startButton}
              onPress={() => startProject(selectedStyle)}
            >
              Start This Project
            </Button>
          </Card.Content>
        </Card>
      )}

      <Title style={styles.sectionTitle}>Learning Resources</Title>
      <Card style={styles.resourcesCard}>
        <Card.Content>
          <Title>Free Beginner Courses</Title>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Basic Plant Care', 'Understanding Soil', 'Watering 101', 'Garden Planning'].map((course, index) => (
              <Card key={index} style={styles.courseCard}>
                <Card.Content>
                  <Title>{course}</Title>
                  <Button mode="contained">Start Course</Button>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        </Card.Content>
      </Card>
    </View>
  );

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    // Implementation for quiz logic
  };

  const markStepComplete = (step: string) => {
    if (completedSteps.includes(step)) {
      setCompletedSteps(completedSteps.filter((s) => s !== step));
    } else {
      setCompletedSteps([...completedSteps, step]);
    }
  };

  const startProject = (style: FarmingStyle) => {
    // Implementation for starting a project
  };

  return (
    <ScrollView style={styles.container}>
      {showQuiz ? renderPersonalityQuiz() : renderBeginnerGuide()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  guideContainer: {
    padding: 20,
  },
  guideTitle: {
    fontSize: 24,
    marginBottom: 10,
  },
  guideParagraph: {
    fontSize: 16,
    marginBottom: 20,
  },
  quizButton: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    marginVertical: 15,
  },
  styleCard: {
    width: 300,
    marginRight: 15,
    marginBottom: 15,
  },
  statsContainer: {
    marginTop: 10,
  },
  stat: {
    marginVertical: 2,
  },
  detailCard: {
    marginVertical: 20,
  },
  subsectionTitle: {
    fontSize: 18,
    marginTop: 15,
    marginBottom: 10,
  },
  listItem: {
    marginVertical: 5,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  stepNumber: {
    width: 30,
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
  },
  stepButton: {
    marginLeft: 10,
  },
  progressBar: {
    marginVertical: 10,
  },
  startButton: {
    marginTop: 20,
  },
  resourcesCard: {
    marginVertical: 20,
  },
  courseCard: {
    width: 200,
    marginRight: 15,
  },
  quizCard: {
    margin: 20,
  },
  questionContainer: {
    marginVertical: 15,
  },
  question: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  optionButton: {
    padding: 15,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    marginVertical: 5,
  },
});

export default BeginnerJourneyDemo;
