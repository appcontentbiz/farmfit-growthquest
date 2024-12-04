import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Image } from 'react-native';
import { Card, Text, Button, Icon, Input, Overlay } from 'react-native-elements';

interface HeritageCrop {
  id: string;
  name: string;
  origin: string;
  history: string;
  cultivationTips: string[];
  preservationStatus: 'endangered' | 'stable' | 'thriving';
  imageUrl: string;
}

interface CulturalPractice {
  id: string;
  name: string;
  description: string;
  region: string;
  season: string;
  participants: number;
}

const heritageCrops: HeritageCrop[] = [
  {
    id: 'hc-1',
    name: 'Purple Mountain Corn',
    origin: 'Andean Region',
    history: 'Ancient variety cultivated by Incan civilizations for ceremonial purposes',
    cultivationTips: [
      'Plant at high altitudes (2000-3000m)',
      'Requires well-draining soil',
      'Traditional companion planting with beans'
    ],
    preservationStatus: 'endangered',
    imageUrl: 'https://example.com/purple-corn.jpg'
  },
  {
    id: 'hc-2',
    name: 'Heritage Wheat Landrace',
    origin: 'Fertile Crescent',
    history: 'Traditional wheat variety preserved through generations of family farming',
    cultivationTips: [
      'Drought resistant variety',
      'Natural pest resistance',
      'Excellent for artisanal baking'
    ],
    preservationStatus: 'stable',
    imageUrl: 'https://example.com/wheat.jpg'
  }
];

const culturalPractices: CulturalPractice[] = [
  {
    id: 'cp-1',
    name: 'Three Sisters Planting',
    description: 'Traditional Native American agricultural practice of growing corn, beans, and squash together',
    region: 'North America',
    season: 'Spring',
    participants: 150
  },
  {
    id: 'cp-2',
    name: 'Terrace Farming',
    description: 'Ancient technique of cutting steps into mountain slopes for agriculture',
    region: 'Global',
    season: 'Year-round',
    participants: 500
  }
];

export const HeritagePreservation: React.FC = () => {
  const [selectedCrop, setSelectedCrop] = useState<HeritageCrop | null>(null);
  const [showPracticeForm, setShowPracticeForm] = useState(false);
  const [newPractice, setNewPractice] = useState<Partial<CulturalPractice>>({});

  const getPreservationStatusColor = (status: string) => {
    switch (status) {
      case 'endangered':
        return '#F44336';
      case 'stable':
        return '#FFC107';
      case 'thriving':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  const renderCropCard = (crop: HeritageCrop) => (
    <Card key={crop.id} containerStyle={styles.card}>
      <View style={styles.cropHeader}>
        <View>
          <Text style={styles.cropName}>{crop.name}</Text>
          <Text style={styles.cropOrigin}>{crop.origin}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getPreservationStatusColor(crop.preservationStatus) }
        ]}>
          <Text style={styles.statusText}>{crop.preservationStatus}</Text>
        </View>
      </View>
      <Text style={styles.cropHistory}>{crop.history}</Text>
      <View style={styles.cultivationTips}>
        <Text style={styles.sectionTitle}>Cultivation Tips</Text>
        {crop.cultivationTips.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <Icon name="eco" type="material" color="#4CAF50" size={16} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
      <Button
        title="View Details"
        icon={<Icon name="visibility" color="white" />}
        buttonStyle={styles.detailsButton}
        onPress={() => setSelectedCrop(crop)}
      />
    </Card>
  );

  const renderCulturalPracticeCard = (practice: CulturalPractice) => (
    <Card key={practice.id} containerStyle={styles.card}>
      <Text style={styles.practiceName}>{practice.name}</Text>
      <Text style={styles.practiceDescription}>{practice.description}</Text>
      <View style={styles.practiceDetails}>
        <View style={styles.practiceDetail}>
          <Icon name="place" type="material" color="#2196F3" size={16} />
          <Text style={styles.detailText}>{practice.region}</Text>
        </View>
        <View style={styles.practiceDetail}>
          <Icon name="event" type="material" color="#2196F3" size={16} />
          <Text style={styles.detailText}>{practice.season}</Text>
        </View>
        <View style={styles.practiceDetail}>
          <Icon name="people" type="material" color="#2196F3" size={16} />
          <Text style={styles.detailText}>{practice.participants} participants</Text>
        </View>
      </View>
    </Card>
  );

  const renderCropDetailsOverlay = () => (
    <Overlay
      isVisible={!!selectedCrop}
      onBackdropPress={() => setSelectedCrop(null)}
      overlayStyle={styles.overlay}
    >
      {selectedCrop && (
        <ScrollView>
          <Text style={styles.overlayTitle}>{selectedCrop.name}</Text>
          <Image
            source={{ uri: selectedCrop.imageUrl }}
            style={styles.cropImage}
            resizeMode="cover"
          />
          <Text style={styles.overlaySubtitle}>History & Origin</Text>
          <Text style={styles.overlayText}>{selectedCrop.history}</Text>
          <Text style={styles.overlaySubtitle}>Cultivation Guidelines</Text>
          {selectedCrop.cultivationTips.map((tip, index) => (
            <View key={index} style={styles.overlayTip}>
              <Icon name="check-circle" type="material" color="#4CAF50" size={20} />
              <Text style={styles.overlayTipText}>{tip}</Text>
            </View>
          ))}
          <Button
            title="Close"
            onPress={() => setSelectedCrop(null)}
            buttonStyle={styles.closeButton}
          />
        </ScrollView>
      )}
    </Overlay>
  );

  const renderAddPracticeOverlay = () => (
    <Overlay
      isVisible={showPracticeForm}
      onBackdropPress={() => setShowPracticeForm(false)}
      overlayStyle={styles.overlay}
    >
      <ScrollView>
        <Text style={styles.overlayTitle}>Add Cultural Practice</Text>
        <Input
          placeholder="Practice Name"
          value={newPractice.name}
          onChangeText={(text) => setNewPractice({ ...newPractice, name: text })}
        />
        <Input
          placeholder="Description"
          multiline
          numberOfLines={3}
          value={newPractice.description}
          onChangeText={(text) => setNewPractice({ ...newPractice, description: text })}
        />
        <Input
          placeholder="Region"
          value={newPractice.region}
          onChangeText={(text) => setNewPractice({ ...newPractice, region: text })}
        />
        <Input
          placeholder="Season"
          value={newPractice.season}
          onChangeText={(text) => setNewPractice({ ...newPractice, season: text })}
        />
        <Button
          title="Submit"
          onPress={() => {
            // Handle submission
            setShowPracticeForm(false);
            setNewPractice({});
          }}
          buttonStyle={styles.submitButton}
        />
      </ScrollView>
    </Overlay>
  );

  return (
    <ScrollView style={styles.container}>
      <Card containerStyle={styles.headerCard}>
        <Text style={styles.headerTitle}>Heritage Crop Preservation</Text>
        <Text style={styles.headerDescription}>
          Preserving agricultural biodiversity through traditional farming practices
          and heritage crop varieties.
        </Text>
      </Card>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Heritage Crops</Text>
        {heritageCrops.map(renderCropCard)}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cultural Practices</Text>
          <Button
            title="Add Practice"
            type="outline"
            icon={<Icon name="add" color="#2196F3" />}
            onPress={() => setShowPracticeForm(true)}
          />
        </View>
        {culturalPractices.map(renderCulturalPracticeCard)}
      </View>

      {renderCropDetailsOverlay()}
      {renderAddPracticeOverlay()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerCard: {
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 16,
    color: '#757575',
  },
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  card: {
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 4,
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cropName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  cropOrigin: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cropHistory: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 12,
  },
  cultivationTips: {
    marginVertical: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#424242',
    marginLeft: 8,
  },
  detailsButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    marginTop: 8,
  },
  practiceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  practiceDescription: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 12,
  },
  practiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  practiceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginVertical: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 4,
  },
  overlay: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 10,
    padding: 16,
  },
  overlayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  cropImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  overlaySubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 16,
    marginBottom: 8,
  },
  overlayText: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 12,
  },
  overlayTip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  overlayTipText: {
    fontSize: 14,
    color: '#424242',
    marginLeft: 8,
    flex: 1,
  },
  closeButton: {
    backgroundColor: '#757575',
    borderRadius: 8,
    marginTop: 16,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    marginTop: 16,
  },
});
