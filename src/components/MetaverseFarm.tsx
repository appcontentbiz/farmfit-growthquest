import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Dimensions } from 'react-native';
import { Card, Text, Button, Icon } from 'react-native-elements';
import { WebView } from 'react-native-webview';

interface VirtualEnvironment {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const virtualEnvironments: VirtualEnvironment[] = [
  {
    id: 'indoor-garden',
    name: 'Indoor Garden Simulator',
    description: 'Learn indoor gardening techniques in a controlled environment',
    difficulty: 'beginner',
  },
  {
    id: 'vertical-farm',
    name: 'Vertical Farm Manager',
    description: 'Master vertical farming systems and hydroponics',
    difficulty: 'intermediate',
  },
  {
    id: 'commercial-greenhouse',
    name: 'Commercial Greenhouse',
    description: 'Operate a large-scale commercial greenhouse',
    difficulty: 'advanced',
  },
];

export const MetaverseFarm: React.FC = () => {
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(null);

  const renderEnvironmentCard = (environment: VirtualEnvironment) => (
    <Card key={environment.id} containerStyle={styles.card}>
      <View style={styles.environmentHeader}>
        <Text style={styles.environmentTitle}>{environment.name}</Text>
        <View style={[
          styles.difficultyBadge,
          { backgroundColor: getDifficultyColor(environment.difficulty) }
        ]}>
          <Text style={styles.difficultyText}>{environment.difficulty}</Text>
        </View>
      </View>
      <Text style={styles.description}>{environment.description}</Text>
      <Button
        title={selectedEnvironment === environment.id ? 'Exit Environment' : 'Enter Environment'}
        onPress={() => setSelectedEnvironment(
          selectedEnvironment === environment.id ? null : environment.id
        )}
        buttonStyle={styles.button}
      />
    </Card>
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '#4CAF50';
      case 'intermediate':
        return '#FFC107';
      case 'advanced':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  return (
    <View style={styles.container}>
      {selectedEnvironment ? (
        <View style={styles.virtualEnvironment}>
          <WebView
            source={{ html: getVirtualEnvironmentHTML(selectedEnvironment) }}
            style={styles.webview}
          />
          <Button
            title="Exit Virtual Environment"
            onPress={() => setSelectedEnvironment(null)}
            buttonStyle={styles.exitButton}
          />
        </View>
      ) : (
        <ScrollView>
          <Card containerStyle={styles.welcomeCard}>
            <Card.Title>Welcome to Virtual Farm Training</Card.Title>
            <Text style={styles.welcomeText}>
              Select a virtual environment to begin your training. Each environment
              offers unique challenges and learning opportunities.
            </Text>
          </Card>
          {virtualEnvironments.map(renderEnvironmentCard)}
        </ScrollView>
      )}
    </View>
  );
};

const getVirtualEnvironmentHTML = (environmentId: string) => {
  // This would be replaced with actual 3D environment content
  return `
    <html>
      <head>
        <style>
          body { margin: 0; overflow: hidden; }
          #virtual-environment {
            width: 100vw;
            height: 100vh;
            background: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: Arial, sans-serif;
          }
        </style>
      </head>
      <body>
        <div id="virtual-environment">
          <h2>Virtual Environment: ${environmentId}</h2>
        </div>
      </body>
    </html>
  `;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 4,
  },
  welcomeCard: {
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    elevation: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginVertical: 8,
  },
  environmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  environmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
  },
  button: {
    borderRadius: 8,
  },
  virtualEnvironment: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  exitButton: {
    backgroundColor: '#F44336',
    margin: 16,
    borderRadius: 8,
  },
});
