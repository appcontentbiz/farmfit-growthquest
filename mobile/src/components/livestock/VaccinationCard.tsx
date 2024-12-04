import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Text, Button, useTheme, List } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Vaccination } from '../../types/livestock';

interface Props {
  vaccinations: Vaccination[];
  onAddVaccination: () => void;
}

const VaccinationCard: React.FC<Props> = ({ vaccinations, onAddVaccination }) => {
  const theme = useTheme();

  const sortedVaccinations = [...vaccinations].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate).getTime() < new Date().getTime();
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Icon name="needle" size={24} color={theme.colors.primary} />
            <Title style={styles.title}>Vaccinations</Title>
          </View>
          <Button
            mode="contained"
            onPress={onAddVaccination}
            style={styles.addButton}
          >
            Add
          </Button>
        </View>

        {sortedVaccinations.length === 0 ? (
          <Text style={styles.emptyText}>No vaccinations recorded</Text>
        ) : (
          <List.Section>
            {sortedVaccinations.map((vaccination) => {
              const overdueStatus = isOverdue(vaccination.dueDate);
              return (
                <List.Item
                  key={vaccination.id}
                  title={vaccination.type}
                  description={`Due: ${new Date(vaccination.dueDate).toLocaleDateString()}`}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={overdueStatus ? 'alert' : 'check-circle'}
                      color={overdueStatus ? theme.colors.error : theme.colors.primary}
                    />
                  )}
                  right={props => (
                    <View style={styles.itemRight}>
                      <Text style={[
                        styles.status,
                        { color: overdueStatus ? theme.colors.error : theme.colors.primary }
                      ]}>
                        {overdueStatus ? 'Overdue' : 'Scheduled'}
                      </Text>
                      <Text style={styles.performer}>
                        By: {vaccination.performer}
                      </Text>
                    </View>
                  )}
                  style={[
                    styles.listItem,
                    { borderLeftColor: overdueStatus ? theme.colors.error : theme.colors.primary }
                  ]}
                />
              );
            })}
          </List.Section>
        )}

        <View style={styles.summary}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{vaccinations.length}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Overdue</Text>
            <Text style={[
              styles.statValue,
              { color: theme.colors.error }
            ]}>
              {vaccinations.filter(v => isOverdue(v.dueDate)).length}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Upcoming</Text>
            <Text style={[
              styles.statValue,
              { color: theme.colors.primary }
            ]}>
              {vaccinations.filter(v => !isOverdue(v.dueDate)).length}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: 8,
    fontSize: 18,
  },
  addButton: {
    borderRadius: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    opacity: 0.7,
  },
  listItem: {
    borderLeftWidth: 4,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  itemRight: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  performer: {
    fontSize: 12,
    opacity: 0.7,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
});

export default VaccinationCard;
