import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card, Text, Icon } from 'react-native-elements';
import { FarmingModule } from '../types/farming';

interface ModuleCardProps {
  module: FarmingModule;
  onPress: () => void;
  isUnlocked: boolean;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  onPress,
  isUnlocked
}) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Card containerStyle={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{module.name}</Text>
          <Icon
            name={isUnlocked ? 'lock-open' : 'lock'}
            type="material"
            color={isUnlocked ? '#4CAF50' : '#757575'}
          />
        </View>
        <Text style={styles.description}>{module.description}</Text>
        <View style={styles.features}>
          {module.features.map((feature) => (
            <View key={feature.id} style={styles.featureItem}>
              <Icon
                name={feature.isAdvanced ? 'star' : 'check'}
                type="material"
                size={16}
                color={feature.isAdvanced ? '#FFC107' : '#4CAF50'}
              />
              <Text style={styles.featureText}>{feature.name}</Text>
            </View>
          ))}
        </View>
        <View style={styles.footer}>
          <Text style={styles.tierText}>Required Tier: {module.requiredTier}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  description: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
  },
  features: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#424242',
  },
  footer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  tierText: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'right',
  },
});
