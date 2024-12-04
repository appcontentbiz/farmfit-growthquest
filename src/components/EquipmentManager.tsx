import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Card, Text, Button, Icon, ListItem } from 'react-native-elements';

interface Equipment {
  id: string;
  name: string;
  type: string;
  status: 'available' | 'in-use' | 'maintenance';
  cost: number;
  location: string;
  nextMaintenance: string;
}

interface FinancingOption {
  id: string;
  name: string;
  provider: string;
  interestRate: number;
  term: string;
  minCredit: number;
}

const sampleEquipment: Equipment[] = [
  {
    id: 'tractor-1',
    name: 'John Deere 5075E',
    type: 'Tractor',
    status: 'available',
    cost: 75000,
    location: 'Main Barn',
    nextMaintenance: '2024-02-15'
  },
  {
    id: 'harvester-1',
    name: 'Case IH 250',
    type: 'Harvester',
    status: 'in-use',
    cost: 150000,
    location: 'Field 3',
    nextMaintenance: '2024-03-01'
  }
];

const financingOptions: FinancingOption[] = [
  {
    id: 'loan-1',
    name: 'Agricultural Equipment Loan',
    provider: 'Farm Credit Services',
    interestRate: 4.5,
    term: '5 years',
    minCredit: 680
  },
  {
    id: 'lease-1',
    name: 'Flexible Lease Program',
    provider: 'Equipment Finance Co',
    interestRate: 5.2,
    term: '3 years',
    minCredit: 650
  }
];

export const EquipmentManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'financing' | 'maintenance'>('inventory');

  const renderInventoryTab = () => (
    <ScrollView>
      {sampleEquipment.map((item) => (
        <ListItem key={item.id} bottomDivider>
          <Icon
            name={getEquipmentIcon(item.type)}
            type="material"
            color={getStatusColor(item.status)}
          />
          <ListItem.Content>
            <ListItem.Title>{item.name}</ListItem.Title>
            <ListItem.Subtitle>{item.type}</ListItem.Subtitle>
          </ListItem.Content>
          <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
          <ListItem.Chevron />
        </ListItem>
      ))}
      <Button
        title="Add New Equipment"
        icon={<Icon name="add" color="white" />}
        buttonStyle={styles.addButton}
        containerStyle={styles.buttonContainer}
      />
    </ScrollView>
  );

  const renderFinancingTab = () => (
    <ScrollView>
      {financingOptions.map((option) => (
        <Card key={option.id} containerStyle={styles.card}>
          <Card.Title>{option.name}</Card.Title>
          <View style={styles.financingDetails}>
            <Text>Provider: {option.provider}</Text>
            <Text>Interest Rate: {option.interestRate}%</Text>
            <Text>Term: {option.term}</Text>
            <Text>Min. Credit Score: {option.minCredit}</Text>
          </View>
          <Button
            title="Apply Now"
            buttonStyle={styles.applyButton}
          />
        </Card>
      ))}
    </ScrollView>
  );

  const renderMaintenanceTab = () => (
    <ScrollView>
      {sampleEquipment.map((item) => (
        <Card key={item.id} containerStyle={styles.card}>
          <Card.Title>{item.name}</Card.Title>
          <View style={styles.maintenanceDetails}>
            <Text>Next Maintenance: {item.nextMaintenance}</Text>
            <Text>Location: {item.location}</Text>
            <View style={styles.maintenanceActions}>
              <Button
                title="Schedule Service"
                buttonStyle={styles.serviceButton}
                containerStyle={styles.actionButton}
              />
              <Button
                title="View History"
                type="outline"
                containerStyle={styles.actionButton}
              />
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );

  const getEquipmentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'tractor':
        return 'agriculture';
      case 'harvester':
        return 'grass';
      default:
        return 'build';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#4CAF50';
      case 'in-use':
        return '#2196F3';
      case 'maintenance':
        return '#FFC107';
      default:
        return '#757575';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <Button
          title="Inventory"
          type={activeTab === 'inventory' ? 'solid' : 'outline'}
          onPress={() => setActiveTab('inventory')}
          containerStyle={styles.tabButton}
        />
        <Button
          title="Financing"
          type={activeTab === 'financing' ? 'solid' : 'outline'}
          onPress={() => setActiveTab('financing')}
          containerStyle={styles.tabButton}
        />
        <Button
          title="Maintenance"
          type={activeTab === 'maintenance' ? 'solid' : 'outline'}
          onPress={() => setActiveTab('maintenance')}
          containerStyle={styles.tabButton}
        />
      </View>
      {activeTab === 'inventory' && renderInventoryTab()}
      {activeTab === 'financing' && renderFinancingTab()}
      {activeTab === 'maintenance' && renderMaintenanceTab()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    elevation: 4,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  card: {
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  buttonContainer: {
    margin: 16,
  },
  financingDetails: {
    marginVertical: 12,
  },
  applyButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    marginTop: 8,
  },
  maintenanceDetails: {
    marginVertical: 12,
  },
  maintenanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  serviceButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
});
